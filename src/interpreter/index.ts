/**
 * AiScript interpreter
 */

import { autobind } from '../utils/mini-autobind.js';
import { AiScriptError, NonAiScriptError, AiScriptNamespaceError, AiScriptIndexOutOfRangeError, AiScriptRuntimeError } from '../error.js';
import { Scope } from './scope.js';
import { std } from './lib/std.js';
import { assertNumber, assertString, assertFunction, assertBoolean, assertObject, assertArray, eq, isObject, isArray, expectAny, reprValue } from './util.js';
import { NULL, RETURN, unWrapRet, FN_NATIVE, BOOL, NUM, STR, ARR, OBJ, FN, BREAK, CONTINUE, ERROR } from './value.js';
import { getPrimProp } from './primitive-props.js';
import { Variable } from './variable.js';
import type { JsValue } from './util.js';
import type { Value, VFn } from './value.js';
import type * as Ast from '../node.js';

const IRQ_RATE = 300;
const IRQ_AT = IRQ_RATE - 1;

export type LogObject = {
	scope?: string;
	name?: string;
	var?: string;
	val?: Value | Variable;
};

export class Interpreter {
	public stepCount = 0;
	private stop = false;
	public scope: Scope;
	private abortHandlers: (() => void)[] = [];
	private vars: Record<string, Variable> = {};

	constructor(
		consts: Record<string, Value>,
		private opts: {
			in?(q: string): Promise<string>;
			out?(value: Value): void;
			err?(e: AiScriptError): void;
			log?(type: string, params: LogObject): void;
			maxStep?: number;
			abortOnError?: boolean;
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
				const a = await this.opts.in!(q.value);
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
	}

	@autobind
	public async exec(script?: Ast.Node[]): Promise<void> {
		if (script == null || script.length === 0) return;
		try {
			await this.collectNs(script);
			const result = await this._run(script, this.scope);
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
		return await this._fn(fn, args)
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
		return this._fn(fn, args);
	}

	@autobind
	public static collectMetadata(script?: Ast.Node[]): Map<string, JsValue> | undefined {
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

		const meta = new Map();

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
					if (node.mut) {
						throw new AiScriptNamespaceError('No "var" in namespace declaration: ' + node.name, node.loc.start);
					}

					const variable: Variable = {
						isMutable: node.mut,
						value: await this._eval(node.expr, nsScope),
					};
					nsScope.add(node.name, variable);

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
	private async _fn(fn: VFn, args: Value[]): Promise<Value> {
		if (fn.native) {
			const result = fn.native(args, {
				call: this.execFnSimple,
				topCall: this.execFn,
				registerAbortHandler: this.registerAbortHandler,
				unregisterAbortHandler: this.unregisterAbortHandler,
			});
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			return result ?? NULL;
		} else {
			const _args = new Map<string, Variable>();
			for (const i of fn.args.keys()) {
				const argdef = fn.args[i]!;
				if (!argdef.default) expectAny(args[i]);
				_args.set(argdef.name, {
					isMutable: true,
					value: args[i] ?? argdef.default!,
				});
			}
			const fnScope = fn.scope!.createChildScope(_args);
			return unWrapRet(await this._run(fn.statements!, fnScope));
		}
	}

	@autobind
	private _eval(node: Ast.Node, scope: Scope): Promise<Value> {
		return this.__eval(node, scope).catch(e => {
			if (e.pos) throw e;
			else {
				const e2 = (e instanceof AiScriptError) ? e : new NonAiScriptError(e);
				e2.pos = node.loc.start;
				e2.message = `${e2.message} (Line ${e2.pos.line}, Column ${e2.pos.column})`;
				throw e2;
			}
		});
	}

	@autobind
	private async __eval(node: Ast.Node, scope: Scope): Promise<Value> {
		if (this.stop) return NULL;
		if (this.stepCount % IRQ_RATE === IRQ_AT) await new Promise(resolve => setTimeout(resolve, 5));
		this.stepCount++;
		if (this.opts.maxStep && this.stepCount > this.opts.maxStep) {
			throw new AiScriptRuntimeError('max step exceeded');
		}

		switch (node.type) {
			case 'call': {
				const callee = await this._eval(node.target, scope);
				assertFunction(callee);
				const args = await Promise.all(node.args.map(expr => this._eval(expr, scope)));
				return this._fn(callee, args);
			}

			case 'if': {
				const cond = await this._eval(node.cond, scope);
				assertBoolean(cond);
				if (cond.value) {
					return this._eval(node.then, scope);
				} else {
					if (node.elseif && node.elseif.length > 0) {
						for (const elseif of node.elseif) {
							const cond = await this._eval(elseif.cond, scope);
							assertBoolean(cond);
							if (cond.value) {
								return this._eval(elseif.then, scope);
							}
						}
						if (node.else) {
							return this._eval(node.else, scope);
						}
					} else if (node.else) {
						return this._eval(node.else, scope);
					}
				}
				return NULL;
			}

			case 'match': {
				const about = await this._eval(node.about, scope);
				for (const qa of node.qs) {
					const q = await this._eval(qa.q, scope);
					if (eq(about, q)) {
						return await this._eval(qa.a, scope);
					}
				}
				if (node.default) {
					return await this._eval(node.default, scope);
				}
				return NULL;
			}

			case 'loop': {
				// eslint-disable-next-line no-constant-condition
				while (true) {
					const v = await this._run(node.statements, scope.createChildScope());
					if (v.type === 'break') {
						break;
					} else if (v.type === 'return') {
						return v;
					}
				}
				return NULL;
			}

			case 'for': {
				if (node.times) {
					const times = await this._eval(node.times, scope);
					assertNumber(times);
					for (let i = 0; i < times.value; i++) {
						const v = await this._eval(node.for, scope);
						if (v.type === 'break') {
							break;
						} else if (v.type === 'return') {
							return v;
						}
					}
				} else {
					const from = await this._eval(node.from!, scope);
					const to = await this._eval(node.to!, scope);
					assertNumber(from);
					assertNumber(to);
					for (let i = from.value; i < from.value + to.value; i++) {
						const v = await this._eval(node.for, scope.createChildScope(new Map([
							[node.var!, {
								isMutable: false,
								value: NUM(i),
							}],
						])));
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
				const items = await this._eval(node.items, scope);
				assertArray(items);
				for (const item of items.value) {
					const v = await this._eval(node.for, scope.createChildScope(new Map([
						[node.var, {
							isMutable: false,
							value: item,
						}],
					])));
					if (v.type === 'break') {
						break;
					} else if (v.type === 'return') {
						return v;
					}
				}
				return NULL;
			}

			case 'def': {
				const value = await this._eval(node.expr, scope);
				if (node.attr.length > 0) {
					const attrs: Value['attr'] = [];
					for (const nAttr of node.attr) {
						attrs.push({
							name: nAttr.name,
							value: await this._eval(nAttr.value, scope),
						});
					}
					value.attr = attrs;
				}
				scope.add(node.name, {
					isMutable: node.mut,
					value: value,
				});
				return NULL;
			}

			case 'identifier': {
				return scope.get(node.name);
			}

			case 'assign': {
				const v = await this._eval(node.expr, scope);

				await this.assign(scope, node.dest, v);

				return NULL;
			}

			case 'addAssign': {
				const target = await this._eval(node.dest, scope);
				assertNumber(target);
				const v = await this._eval(node.expr, scope);
				assertNumber(v);

				await this.assign(scope, node.dest, NUM(target.value + v.value));
				return NULL;
			}

			case 'subAssign': {
				const target = await this._eval(node.dest, scope);
				assertNumber(target);
				const v = await this._eval(node.expr, scope);
				assertNumber(v);

				await this.assign(scope, node.dest, NUM(target.value - v.value));
				return NULL;
			}

			case 'null': return NULL;

			case 'bool': return BOOL(node.value);

			case 'num': return NUM(node.value);

			case 'str': return STR(node.value);

			case 'arr': return ARR(await Promise.all(node.value.map(item => this._eval(item, scope))));

			case 'obj': {
				const obj = new Map() as Map<string, Value>;
				for (const k of node.value.keys()) {
					obj.set(k, await this._eval(node.value.get(k)!, scope));
				}
				return OBJ(obj);
			}

			case 'prop': {
				const target = await this._eval(node.target, scope);
				if (isObject(target)) {
					if (target.value.has(node.name)) {
						return target.value.get(node.name)!;
					} else {
						return NULL;
					}
				} else {
					return getPrimProp(target, node.name);
				}
			}

			case 'index': {
				const target = await this._eval(node.target, scope);
				const i = await this._eval(node.index, scope);
				if (isArray(target)) {
					assertNumber(i);
					const item = target.value[i.value];
					if (item === undefined) {
						throw new AiScriptIndexOutOfRangeError(`Index out of range. index: ${i.value} max: ${target.value.length - 1}`);
					}
					return item;
				} else if (isObject(target)) {
					assertString(i);
					if (target.value.has(i.value)) {
						return target.value.get(i.value)!;
					} else {
						return NULL;
					}
				} else {
					throw new AiScriptRuntimeError(`Cannot read prop (${reprValue(i)}) of ${target.type}.`);
				}
			}

			case 'not': {
				const v = await this._eval(node.expr, scope);
				assertBoolean(v);
				return BOOL(!v.value);
			}

			case 'fn': {
				return FN(
					await Promise.all(node.args.map(async (arg) => {
						return {
							name: arg.name,
							default: arg.default ? await this._eval(arg.default, scope) : arg.optional ? NULL : undefined,
							// type: (TODO)
						};
					})),
					node.children,
					scope,
				);
			}

			case 'block': {
				return this._run(node.statements, scope.createChildScope());
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
						const v = await this._eval(x, scope);
						str += reprValue(v);
					}
				}
				return STR(str);
			}

			case 'return': {
				const val = await this._eval(node.expr, scope);
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

			case 'and': {
				const leftValue = await this._eval(node.left, scope);
				assertBoolean(leftValue);

				if (!leftValue.value) {
					return leftValue;
				} else {
					const rightValue = await this._eval(node.right, scope);
					assertBoolean(rightValue);
					return rightValue;
				}
			}

			case 'or': {
				const leftValue = await this._eval(node.left, scope);
				assertBoolean(leftValue);

				if (leftValue.value) {
					return leftValue;
				} else {
					const rightValue = await this._eval(node.right, scope);
					assertBoolean(rightValue);
					return rightValue;
				}
			}

			default: {
				throw new Error('invalid node type');
			}
		}
	}

	@autobind
	private async _run(program: Ast.Node[], scope: Scope): Promise<Value> {
		this.log('block:enter', { scope: scope.name });

		let v: Value = NULL;

		for (let i = 0; i < program.length; i++) {
			const node = program[i]!;

			v = await this._eval(node, scope);
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
	public unregisterAbortHandler(handler: () => void): void {
		this.abortHandlers = this.abortHandlers.filter(h => h !== handler);
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
	private async assign(scope: Scope, dest: Ast.Expression, value: Value): Promise<void> {
		if (dest.type === 'identifier') {
			scope.assign(dest.name, value);
		} else if (dest.type === 'index') {
			const assignee = await this._eval(dest.target, scope);
			const i = await this._eval(dest.index, scope);
			if (isArray(assignee)) {
				assertNumber(i);
				if (assignee.value[i.value] === undefined) {
					throw new AiScriptIndexOutOfRangeError(`Index out of range. index: ${i.value} max: ${assignee.value.length - 1}`);
				}
				assignee.value[i.value] = value;
			} else if (isObject(assignee)) {
				assertString(i);
				assignee.value.set(i.value, value);
			} else {
				throw new AiScriptRuntimeError(`Cannot read prop (${reprValue(i)}) of ${assignee.type}.`);
			}
		} else if (dest.type === 'prop') {
			const assignee = await this._eval(dest.target, scope);
			assertObject(assignee);

			assignee.value.set(dest.name, value);
		} else if (dest.type === 'arr') {
			assertArray(value);
			await Promise.all(dest.value.map(
				(item, index) => this.assign(scope, item, value.value[index] ?? NULL)
			));
		} else if (dest.type === 'obj') {
			assertObject(value);
			await Promise.all([...dest.value].map(
				([key, item]) => this.assign(scope, item, value.value.get(key) ?? NULL)
			));
		} else {
			throw new AiScriptRuntimeError('The left-hand side of an assignment expression must be a variable or a property/index access.');
		}
	}
}
