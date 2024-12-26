/**
 * AiScript interpreter
 */

import { autobind } from '../utils/mini-autobind.js';
import { AiScriptError, NonAiScriptError, AiScriptNamespaceError, AiScriptIndexOutOfRangeError, AiScriptRuntimeError, AiScriptHostsideError } from '../error.js';
import * as Ast from '../node.js';
import { Scope } from './scope.js';
import { std } from './lib/std.js';
import { RETURN, unWrapRet, BREAK, CONTINUE, assertValue, isControl, type Control } from './control.js';
import { assertNumber, assertString, assertFunction, assertBoolean, assertObject, assertArray, eq, isObject, isArray, expectAny, reprValue, isFunction } from './util.js';
import { NULL, FN_NATIVE, BOOL, NUM, STR, ARR, OBJ, FN, ERROR } from './value.js';
import { getPrimProp } from './primitive-props.js';
import { Variable } from './variable.js';
import { Reference } from './reference.js';
import type { JsValue } from './util.js';
import type { Value, VFn, VFnParam } from './value.js';

export type LogObject = {
	scope?: string;
	var?: string;
	val?: Value | Variable;
};

type CallInfo = {
	name: string;
	pos: Ast.Pos | undefined;
};

export class Interpreter {
	public stepCount = 0;
	private stop = false;
	private pausing: { promise: Promise<void>, resolve: () => void } | null = null;
	public scope: Scope;
	private abortHandlers: (() => void)[] = [];
	private pauseHandlers: (() => void)[] = [];
	private unpauseHandlers: (() => void)[] = [];
	private vars: Record<string, Variable> = {};
	private irqRate: number;
	private irqSleep: () => Promise<void>;

	constructor(
		consts: Record<string, Value>,
		private opts: {
			in?(q: string): Promise<string>;
			out?(value: Value): void;
			err?(e: AiScriptError): void;
			log?(type: string, params: LogObject): void;
			maxStep?: number;
			abortOnError?: boolean;
			irqRate?: number;
			irqSleep?: number | (() => Promise<void>);
		} = {},
	) {
		const io = {
			print: FN_NATIVE(([v]) => {
				expectAny(v);
				if (this.opts.out) this.opts.out(v);
			}),
			readline: FN_NATIVE(async args => {
				const q = args[0];
				assertString(q);
				if (this.opts.in == null) return NULL;
				const a = await this.opts.in(q.value);
				return STR(a);
			}),
		};

		this.vars = Object.fromEntries(Object.entries({
			...consts,
			...std,
			...io,
		}).map(([k, v]) => [k, Variable.const(v)]));

		this.scope = new Scope([new Map(Object.entries(this.vars))]);
		this.scope.opts.log = (type, params): void => {
			switch (type) {
				case 'add': this.log('var:add', params); break;
				case 'read': this.log('var:read', params); break;
				case 'write': this.log('var:write', params); break;
				default: break;
			}
		};

		if (!((this.opts.irqRate ?? 300) >= 0)) {
			throw new AiScriptHostsideError(`Invalid IRQ rate (${this.opts.irqRate}): must be non-negative number`);
		}
		this.irqRate = this.opts.irqRate ?? 300;

		const sleep = (time: number) => (
			(): Promise<void> => new Promise(resolve => setTimeout(resolve, time))
		);

		if (typeof this.opts.irqSleep === 'function') {
			this.irqSleep = this.opts.irqSleep;
		} else if (this.opts.irqSleep === undefined) {
			this.irqSleep = sleep(5);
		} else if (this.opts.irqSleep >= 0) {
			this.irqSleep = sleep(this.opts.irqSleep);
		} else {
			throw new AiScriptHostsideError('irqSleep must be a function or a positive number.');
		}
	}

	@autobind
	public async exec(script?: Ast.Node[]): Promise<void> {
		if (script == null || script.length === 0) return;
		try {
			await this.collectNs(script);
			const result = await this._run(script, this.scope, []);
			assertValue(result);
			this.log('end', { val: result });
		} catch (e) {
			this.handleError(e);
		}
	}

	/**
	 * Executes AiScript Function.
	 * When it fails,
	 * (i)If error callback is registered via constructor, this.abort is called and the callback executed, then returns ERROR('func_failed').
	 * (ii)Otherwise, just throws a error.
	 *
	 * @remarks This is the same function as that passed to AiScript NATIVE functions as opts.topCall.
	 */
	@autobind
	public async execFn(fn: VFn, args: Value[]): Promise<Value> {
		return await this._fn(fn, args, [])
			.catch(e => {
				this.handleError(e);
				return ERROR('func_failed');
			});
	}
	/**
	 * Executes AiScript Function.
	 * Almost same as execFn but when error occurs this always throws and never calls callback.
	 *
	 * @remarks This is the same function as that passed to AiScript NATIVE functions as opts.call.
	 */
	@autobind
	public execFnSimple(fn: VFn, args: Value[]): Promise<Value> {
		return this._fn(fn, args, []);
	}

	@autobind
	public static collectMetadata(script?: Ast.Node[]): Map<string | null, JsValue> | undefined {
		if (script == null || script.length === 0) return;

		function nodeToJs(node: Ast.Node): JsValue {
			switch (node.type) {
				case 'arr': return node.value.map(item => nodeToJs(item));
				case 'bool': return node.value;
				case 'null': return null;
				case 'num': return node.value;
				case 'obj': {
					const obj: { [keys: string]: JsValue } = {};
					for (const [k, v] of node.value.entries()) {
						// TODO: keyが__proto__とかじゃないかチェック
						obj[k] = nodeToJs(v);
					}
					return obj;
				}
				case 'str': return node.value;
				default: return undefined;
			}
		}

		const meta = new Map<string | null, JsValue>();

		for (const node of script) {
			switch (node.type) {
				case 'meta': {
					meta.set(node.name, nodeToJs(node.value));
					break;
				}

				default: {
					// nop
				}
			}
		}

		return meta;
	}

	@autobind
	private handleError(e: unknown): void {
		if (!this.opts.err) throw e;
		if (this.opts.abortOnError) {
			// when abortOnError is true, error handler should be called only once
			if (this.stop) return;
			this.abort();
		}
		if (e instanceof AiScriptError) {
			this.opts.err(e);
		} else {
			this.opts.err(new NonAiScriptError(e));
		}
	}

	@autobind
	private log(type: string, params: LogObject): void {
		if (this.opts.log) this.opts.log(type, params);
	}

	@autobind
	private async collectNs(script: Ast.Node[], scope = this.scope): Promise<void> {
		for (const node of script) {
			switch (node.type) {
				case 'ns': {
					await this.collectNsMember(node, scope);
					break;
				}

				default: {
					// nop
				}
			}
		}
	}

	@autobind
	private async collectNsMember(ns: Ast.Namespace, scope = this.scope): Promise<void> {
		const nsScope = scope.createChildNamespaceScope(ns.name);

		await this.collectNs(ns.members, nsScope);

		for (const node of ns.members) {
			switch (node.type) {
				case 'def': {
					if (node.dest.type !== 'identifier') {
						throw new AiScriptNamespaceError('Destructuring assignment is invalid in namespace declarations.', node.loc.start);
					}
					if (node.mut) {
						throw new AiScriptNamespaceError('No "var" in namespace declaration: ' + node.dest.name, node.loc.start);
					}

					const value = await this._eval(node.expr, nsScope, []);
					assertValue(value);
					if (
						node.expr.type === 'fn'
						&& isFunction(value)
						&& !value.native
					) {
						value.name = nsScope.getNsPrefix() + node.dest.name;
					}
					await this.define(nsScope, node.dest, value, node.mut);

					break;
				}

				case 'ns': {
					break; // nop
				}

				default: {
					// exhaustiveness check
					const n: never = node;
					const nd = n as Ast.Node;
					throw new AiScriptNamespaceError('invalid ns member type: ' + nd.type, nd.loc.start);
				}
			}
		}
	}

	@autobind
	private async _fn(fn: VFn, args: Value[], callStack: readonly CallInfo[], pos?: Ast.Pos): Promise<Value> {
		if (fn.native) {
			const info: CallInfo = { name: '<native>', pos };
			const result = fn.native(args, {
				call: (fn, args) => this._fn(fn, args, [...callStack, info]),
				topCall: this.execFn,
				registerAbortHandler: this.registerAbortHandler,
				registerPauseHandler: this.registerPauseHandler,
				registerUnpauseHandler: this.registerUnpauseHandler,
				unregisterAbortHandler: this.unregisterAbortHandler,
				unregisterPauseHandler: this.unregisterPauseHandler,
				unregisterUnpauseHandler: this.unregisterUnpauseHandler,
			});
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			return result ?? NULL;
		} else {
			const fnScope = fn.scope.createChildScope();
			for (const [i, param] of fn.params.entries()) {
				let arg = args[i];
				if (!param.default) {
					expectAny(arg);
				} else if (!arg) {
					arg = param.default;
				}
				this.define(fnScope, param.dest, arg, true);
			}

			const info: CallInfo = { name: fn.name ?? '<anonymous>', pos };
			return unWrapRet(await this._run(fn.statements, fnScope, [...callStack, info]));
		}
	}

	@autobind
	private _evalClause(node: Ast.Statement | Ast.Expression, scope: Scope, callStack: readonly CallInfo[]): Promise<Value | Control> {
		return this._eval(node, Ast.isStatement(node) ? scope.createChildScope() : scope, callStack);
	}

	@autobind
	private async _evalBinaryOperation(op: string, leftExpr: Ast.Expression, rightExpr: Ast.Expression, scope: Scope, callStack: readonly CallInfo[]): Promise<Value | Control> {
		const callee = scope.get(op);
		assertFunction(callee);
		const left = await this._eval(leftExpr, scope, callStack);
		if (isControl(left)) {
			return left;
		}
		const right = await this._eval(rightExpr, scope, callStack);
		if (isControl(right)) {
			return right;
		}
		return this._fn(callee, [left, right], callStack);
	}

	@autobind
	private _eval(node: Ast.Node, scope: Scope, callStack: readonly CallInfo[]): Promise<Value | Control> {
		return this.__eval(node, scope, callStack).catch(e => {
			if (e.pos) throw e;
			else {
				const e2 = (e instanceof AiScriptError) ? e : new NonAiScriptError(e);
				e2.pos = node.loc.start;
				e2.message = [
					e2.message,
					...[...callStack, { pos: e2.pos }].map(({ pos }, i) => {
						const name = callStack[i - 1]?.name ?? '<root>';
						return pos
							? `  at ${name} (Line ${pos.line}, Column ${pos.column})`
							: `  at ${name}`;
					}).reverse(),
				].join('\n');
				throw e2;
			}
		});
	}

	@autobind
	private async __eval(node: Ast.Node, scope: Scope, callStack: readonly CallInfo[]): Promise<Value | Control> {
		if (this.stop) return NULL;
		if (this.pausing) await this.pausing.promise;
		// irqRateが小数の場合は不等間隔になる
		if (this.irqRate !== 0 && this.stepCount % this.irqRate >= this.irqRate - 1) {
			await this.irqSleep();
		}
		this.stepCount++;
		if (this.opts.maxStep && this.stepCount > this.opts.maxStep) {
			throw new AiScriptRuntimeError('max step exceeded');
		}

		switch (node.type) {
			case 'call': {
				const callee = await this._eval(node.target, scope, callStack);
				if (isControl(callee)) {
					return callee;
				}
				assertFunction(callee);
				const args = [];
				for (const expr of node.args) {
					const arg = await this._eval(expr, scope, callStack);
					if (isControl(arg)) {
						return arg;
					}
					args.push(arg);
				}
				return this._fn(callee, args, callStack, node.loc.start);
			}

			case 'if': {
				const cond = await this._eval(node.cond, scope, callStack);
				if (isControl(cond)) {
					return cond;
				}
				assertBoolean(cond);
				if (cond.value) {
					return this._evalClause(node.then, scope, callStack);
				}
				for (const elseif of node.elseif) {
					const cond = await this._eval(elseif.cond, scope, callStack);
					if (isControl(cond)) {
						return cond;
					}
					assertBoolean(cond);
					if (cond.value) {
						return this._evalClause(elseif.then, scope, callStack);
					}
				}
				if (node.else) {
					return this._evalClause(node.else, scope, callStack);
				}
				return NULL;
			}

			case 'match': {
				const about = await this._eval(node.about, scope, callStack);
				if (isControl(about)) {
					return about;
				}
				for (const qa of node.qs) {
					const q = await this._eval(qa.q, scope, callStack);
					if (isControl(q)) {
						return q;
					}
					if (eq(about, q)) {
						return await this._evalClause(qa.a, scope, callStack);
					}
				}
				if (node.default) {
					return await this._evalClause(node.default, scope, callStack);
				}
				return NULL;
			}

			case 'loop': {
				// eslint-disable-next-line no-constant-condition
				while (true) {
					const v = await this._run(node.statements, scope.createChildScope(), callStack);
					if (v.type === 'break') {
						break;
					} else if (v.type === 'return') {
						return v;
					}
				}
				return NULL;
			}

			case 'for': {
				if ('times' in node) {
					const times = await this._eval(node.times, scope, callStack);
					if (isControl(times)) {
						return times;
					}
					assertNumber(times);
					for (let i = 0; i < times.value; i++) {
						const v = await this._evalClause(node.for, scope, callStack);
						if (v.type === 'break') {
							break;
						} else if (v.type === 'return') {
							return v;
						}
					}
				} else {
					const from = await this._eval(node.from, scope, callStack);
					if (isControl(from)) {
						return from;
					}
					const to = await this._eval(node.to, scope, callStack);
					if (isControl(to)) {
						return to;
					}
					assertNumber(from);
					assertNumber(to);
					for (let i = from.value; i < from.value + to.value; i++) {
						const v = await this._eval(node.for, scope.createChildScope(new Map([
							[node.var, {
								isMutable: false,
								value: NUM(i),
							}],
						])), callStack);
						if (v.type === 'break') {
							break;
						} else if (v.type === 'return') {
							return v;
						}
					}
				}
				return NULL;
			}

			case 'each': {
				const items = await this._eval(node.items, scope, callStack);
				if (isControl(items)) {
					return items;
				}
				assertArray(items);
				for (const item of items.value) {
					const eachScope = scope.createChildScope();
					this.define(eachScope, node.var, item, false);
					const v = await this._eval(node.for, eachScope, callStack);
					if (v.type === 'break') {
						break;
					} else if (v.type === 'return') {
						return v;
					}
				}
				return NULL;
			}

			case 'def': {
				const value = await this._eval(node.expr, scope, callStack);
				if (isControl(value)) {
					return value;
				}
				if (node.attr.length > 0) {
					const attrs: Value['attr'] = [];
					for (const nAttr of node.attr) {
						const value = await this._eval(nAttr.value, scope, callStack);
						assertValue(value);
						attrs.push({
							name: nAttr.name,
							value,
						});
					}
					value.attr = attrs;
				}
				if (
					node.expr.type === 'fn'
					&& node.dest.type === 'identifier'
					&& isFunction(value)
					&& !value.native
				) {
					value.name = node.dest.name;
				}
				await this.define(scope, node.dest, value, node.mut);
				return NULL;
			}

			case 'identifier': {
				return scope.get(node.name);
			}

			case 'assign': {
				const target = await this.getReference(node.dest, scope, callStack);
				if (isControl(target)) {
					return target;
				}
				const v = await this._eval(node.expr, scope, callStack);
				if (isControl(v)) {
					return v;
				}

				target.set(v);

				return NULL;
			}

			case 'addAssign': {
				const target = await this.getReference(node.dest, scope, callStack);
				if (isControl(target)) {
					return target;
				}
				const v = await this._eval(node.expr, scope, callStack);
				if (isControl(v)) {
					return v;
				}
				assertNumber(v);
				const targetValue = target.get();
				assertNumber(targetValue);

				target.set(NUM(targetValue.value + v.value));
				return NULL;
			}

			case 'subAssign': {
				const target = await this.getReference(node.dest, scope, callStack);
				if (isControl(target)) {
					return target;
				}
				const v = await this._eval(node.expr, scope, callStack);
				if (isControl(v)) {
					return v;
				}
				assertNumber(v);
				const targetValue = target.get();
				assertNumber(targetValue);

				target.set(NUM(targetValue.value - v.value));
				return NULL;
			}

			case 'null': return NULL;

			case 'bool': return BOOL(node.value);

			case 'num': return NUM(node.value);

			case 'str': return STR(node.value);

			case 'arr': {
				const value = [];
				for (const item of node.value) {
					const valueItem = await this._eval(item, scope, callStack);
					if (isControl(valueItem)) {
						return valueItem;
					}
					value.push(valueItem);
				}
				return ARR(value);
			}

			case 'obj': {
				const obj = new Map<string, Value>();
				for (const [key, valueExpr] of node.value) {
					const value = await this._eval(valueExpr, scope, callStack);
					if (isControl(value)) {
						return value;
					}
					obj.set(key, value);
				}
				return OBJ(obj);
			}

			case 'prop': {
				const target = await this._eval(node.target, scope, callStack);
				if (isControl(target)) {
					return target;
				}
				if (isObject(target)) {
					const value = target.value.get(node.name);
					if (value != null) {
						return value;
					} else {
						return NULL;
					}
				} else {
					return getPrimProp(target, node.name);
				}
			}

			case 'index': {
				const target = await this._eval(node.target, scope, callStack);
				if (isControl(target)) {
					return target;
				}
				const i = await this._eval(node.index, scope, callStack);
				if (isControl(i)) {
					return i;
				}
				if (isArray(target)) {
					assertNumber(i);
					const item = target.value[i.value];
					if (item === undefined) {
						throw new AiScriptIndexOutOfRangeError(`Index out of range. index: ${i.value} max: ${target.value.length - 1}`);
					}
					return item;
				} else if (isObject(target)) {
					assertString(i);
					const value = target.value.get(i.value);
					if (value != null) {
						return value;
					} else {
						return NULL;
					}
				} else {
					throw new AiScriptRuntimeError(`Cannot read prop (${reprValue(i)}) of ${target.type}.`);
				}
			}

			case 'plus': {
				const v = await this._eval(node.expr, scope, callStack);
				if (isControl(v)) {
					return v;
				}
				assertNumber(v);
				return v;
			}

			case 'minus': {
				const v = await this._eval(node.expr, scope, callStack);
				if (isControl(v)) {
					return v;
				}
				assertNumber(v);
				return NUM(-v.value);
			}

			case 'not': {
				const v = await this._eval(node.expr, scope, callStack);
				if (isControl(v)) {
					return v;
				}
				assertBoolean(v);
				return BOOL(!v.value);
			}

			case 'fn': {
				const params: VFnParam[] = [];
				for (const param of node.params) {
					const defaultValue = param.default ? await this._eval(param.default, scope, callStack) :
						param.optional ? NULL :
						undefined;
					if (defaultValue != null && isControl(defaultValue)) {
						return defaultValue;
					}
					params.push({
						dest: param.dest,
						default: defaultValue,
						// type: (TODO)
					});
				}
				return FN(params, node.children, scope);
			}

			case 'block': {
				return this._run(node.statements, scope.createChildScope(), callStack);
			}

			case 'exists': {
				return BOOL(scope.exists(node.identifier.name));
			}

			case 'tmpl': {
				let str = '';
				for (const x of node.tmpl) {
					if (typeof x === 'string') {
						str += x;
					} else {
						const v = await this._eval(x, scope, callStack);
						if (isControl(v)) {
							return v;
						}
						str += reprValue(v);
					}
				}
				return STR(str);
			}

			case 'return': {
				const val = await this._eval(node.expr, scope, callStack);
				if (isControl(val)) {
					return val;
				}
				this.log('block:return', { scope: scope.name, val: val });
				return RETURN(val);
			}

			case 'break': {
				this.log('block:break', { scope: scope.name });
				return BREAK();
			}

			case 'continue': {
				this.log('block:continue', { scope: scope.name });
				return CONTINUE();
			}

			case 'ns': {
				return NULL; // nop
			}

			case 'meta': {
				return NULL; // nop
			}

			case 'pow': {
				return this._evalBinaryOperation('Core:pow', node.left, node.right, scope, callStack);
			}

			case 'mul': {
				return this._evalBinaryOperation('Core:mul', node.left, node.right, scope, callStack);
			}

			case 'div': {
				return this._evalBinaryOperation('Core:div', node.left, node.right, scope, callStack);
			}

			case 'rem': {
				return this._evalBinaryOperation('Core:mod', node.left, node.right, scope, callStack);
			}

			case 'add': {
				return this._evalBinaryOperation('Core:add', node.left, node.right, scope, callStack);
			}

			case 'sub': {
				return this._evalBinaryOperation('Core:sub', node.left, node.right, scope, callStack);
			}

			case 'lt': {
				return this._evalBinaryOperation('Core:lt', node.left, node.right, scope, callStack);
			}

			case 'lteq': {
				return this._evalBinaryOperation('Core:lteq', node.left, node.right, scope, callStack);
			}

			case 'gt': {
				return this._evalBinaryOperation('Core:gt', node.left, node.right, scope, callStack);
			}

			case 'gteq': {
				return this._evalBinaryOperation('Core:gteq', node.left, node.right, scope, callStack);
			}

			case 'eq': {
				return this._evalBinaryOperation('Core:eq', node.left, node.right, scope, callStack);
			}

			case 'neq': {
				return this._evalBinaryOperation('Core:neq', node.left, node.right, scope, callStack);
			}

			case 'and': {
				const leftValue = await this._eval(node.left, scope, callStack);
				if (isControl(leftValue)) {
					return leftValue;
				}
				assertBoolean(leftValue);

				if (!leftValue.value) {
					return leftValue;
				} else {
					const rightValue = await this._eval(node.right, scope, callStack);
					if (isControl(rightValue)) {
						return rightValue;
					}
					assertBoolean(rightValue);
					return rightValue;
				}
			}

			case 'or': {
				const leftValue = await this._eval(node.left, scope, callStack);
				if (isControl(leftValue)) {
					return leftValue;
				}
				assertBoolean(leftValue);

				if (leftValue.value) {
					return leftValue;
				} else {
					const rightValue = await this._eval(node.right, scope, callStack);
					if (isControl(rightValue)) {
						return rightValue;
					}
					assertBoolean(rightValue);
					return rightValue;
				}
			}

			case 'namedTypeSource':
			case 'fnTypeSource':
			case 'unionTypeSource':
			case 'attr': {
				throw new Error('invalid node type');
			}

			default: {
				node satisfies never;
				throw new Error('invalid node type');
			}
		}
	}

	@autobind
	private async _run(program: Ast.Node[], scope: Scope, callStack: readonly CallInfo[]): Promise<Value | Control> {
		this.log('block:enter', { scope: scope.name });

		let v: Value | Control = NULL;

		for (const node of program) {
			v = await this._eval(node, scope, callStack);
			if (v.type === 'return') {
				this.log('block:return', { scope: scope.name, val: v.value });
				return v;
			} else if (v.type === 'break') {
				this.log('block:break', { scope: scope.name });
				return v;
			} else if (v.type === 'continue') {
				this.log('block:continue', { scope: scope.name });
				return v;
			}
		}

		this.log('block:leave', { scope: scope.name, val: v });
		return v;
	}

	@autobind
	public registerAbortHandler(handler: () => void): void {
		this.abortHandlers.push(handler);
	}
	@autobind
	public registerPauseHandler(handler: () => void): void {
		this.pauseHandlers.push(handler);
	}
	@autobind
	public registerUnpauseHandler(handler: () => void): void {
		this.unpauseHandlers.push(handler);
	}

	@autobind
	public unregisterAbortHandler(handler: () => void): void {
		this.abortHandlers = this.abortHandlers.filter(h => h !== handler);
	}
	@autobind
	public unregisterPauseHandler(handler: () => void): void {
		this.pauseHandlers = this.pauseHandlers.filter(h => h !== handler);
	}
	@autobind
	public unregisterUnpauseHandler(handler: () => void): void {
		this.unpauseHandlers = this.unpauseHandlers.filter(h => h !== handler);
	}

	@autobind
	public abort(): void {
		this.stop = true;
		for (const handler of this.abortHandlers) {
			handler();
		}
		this.abortHandlers = [];
	}

	@autobind
	public pause(): void {
		if (this.pausing) return;
		let resolve: () => void;
		const promise = new Promise<void>(r => { resolve = () => r(); });
		this.pausing = { promise, resolve: resolve! };
		for (const handler of this.pauseHandlers) {
			handler();
		}
		this.pauseHandlers = [];
	}

	@autobind
	public unpause(): void {
		if (!this.pausing) return;
		this.pausing.resolve();
		this.pausing = null;
		for (const handler of this.unpauseHandlers) {
			handler();
		}
		this.unpauseHandlers = [];
	}

	@autobind
	private async define(scope: Scope, dest: Ast.Expression, value: Value, isMutable: boolean): Promise<void> {
		switch (dest.type) {
			case 'identifier': {
				scope.add(dest.name, { isMutable, value });
				break;
			}
			case 'arr': {
				assertArray(value);
				await Promise.all(dest.value.map(
					(item, index) => this.define(scope, item, value.value[index] ?? NULL, isMutable),
				));
				break;
			}
			case 'obj': {
				assertObject(value);
				await Promise.all([...dest.value].map(
					([key, item]) => this.define(scope, item, value.value.get(key) ?? NULL, isMutable),
				));
				break;
			}
			default: {
				throw new AiScriptRuntimeError('The left-hand side of an definition expression must be a variable.');
			}
		}
	}

	@autobind
	private async getReference(dest: Ast.Expression, scope: Scope, callStack: readonly CallInfo[]): Promise<Reference | Control> {
		switch (dest.type) {
			case 'identifier': {
				return Reference.variable(dest.name, scope);
			}
			case 'index': {
				const assignee = await this._eval(dest.target, scope, callStack);
				if (isControl(assignee)) {
					return assignee;
				}
				const i = await this._eval(dest.index, scope, callStack);
				if (isControl(i)) {
					return i;
				}
				if (isArray(assignee)) {
					assertNumber(i);
					return Reference.index(assignee, i.value);
				} else if (isObject(assignee)) {
					assertString(i);
					return Reference.prop(assignee, i.value);
				} else {
					throw new AiScriptRuntimeError(`Cannot read prop (${reprValue(i)}) of ${assignee.type}.`);
				}
			}
			case 'prop': {
				const assignee = await this._eval(dest.target, scope, callStack);
				if (isControl(assignee)) {
					return assignee;
				}
				assertObject(assignee);

				return Reference.prop(assignee, dest.name);
			}
			case 'arr': {
				const items: Reference[] = [];
				for (const item of dest.value) {
					const ref = await this.getReference(item, scope, callStack);
					if (isControl(ref)) {
						return ref;
					}
					items.push(ref);
				}
				return Reference.arr(items);
			}
			case 'obj': {
				const entries = new Map<string, Reference>();
				for (const [key, item] of dest.value.entries()) {
					const ref = await this.getReference(item, scope, callStack);
					if (isControl(ref)) {
						return ref;
					}
					entries.set(key, ref);
				}
				return Reference.obj(entries);
			}
			default: {
				throw new AiScriptRuntimeError('The left-hand side of an assignment expression must be a variable or a property/index access.');
			}
		}
	}
}
