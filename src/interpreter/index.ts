/**
 * AiScript interpreter
 */

import autobind from 'autobind-decorator';
import { IndexOutOfRangeError, RuntimeError } from '../error';
import { Scope } from './scope';
import { std } from './lib/std';
import { assertNumber, assertString, assertFunction, assertBoolean, assertObject, assertArray, eq, isObject, isArray, isString, expectAny, isNumber } from './util';
import { NULL, RETURN, unWrapRet, FN_NATIVE, BOOL, NUM, STR, ARR, OBJ, FN, BREAK, CONTINUE } from './value';
import { PRIMITIVE_PROPS } from './primitive-props';
import type { Value, VFn } from './value';
import type * as Ast from '../node';

const IRQ_RATE = 300;
const IRQ_AT = IRQ_RATE - 1;

export class Interpreter {
	private vars: Record<string, Value>;
	private opts: {
		in?(q: string): Promise<string>;
		out?(value: Value): void;
		log?(type: string, params: Record<string, any>): void;
		maxStep?: number;
	};
	public stepCount = 0;
	private stop = false;
	public scope: Scope;
	private abortHandlers: (() => void)[] = [];

	constructor(vars: Interpreter['vars'], opts?: Interpreter['opts']) {
		this.opts = opts ?? {};

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

		this.vars = { ...vars, ...std, ...io };

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

		await this.collectNs(script);

		const result = await this._run(script, this.scope);

		this.log('end', { val: result });
	}

	@autobind
	public async execFn(fn: VFn, args: Value[]): Promise<Value> {
		return this._fn(fn, args);
	}

	@autobind
	public static collectMetadata(script?: Ast.Node[]): Map<any, any> | undefined {
		if (script == null || script.length === 0) return;

		function nodeToJs(node: Ast.Node): any {
			switch (node.type) {
				case 'arr': return node.value.map(item => nodeToJs(item));
				case 'bool': return node.value;
				case 'null': return null;
				case 'num': return node.value;
				case 'obj': {
					const obj: { [keys: string]: object | string | number | boolean | null | undefined } = {};
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
	private log(type: string, params: Record<string, unknown>): void {
		if (this.opts.log) this.opts.log(type, params);
	}

	@autobind
	private async collectNs(script: Ast.Node[]): Promise<void> {
		for (const node of script) {
			switch (node.type) {
				case 'ns': {
					await this.collectNsMember(node);
					break;
				}

				default: {
					// nop
				}
			}
		}
	}

	@autobind
	private async collectNsMember(ns: Ast.Namespace): Promise<void> {
		const scope = this.scope.createChildScope();

		for (const node of ns.members) {
			switch (node.type) {
				case 'def': {
					const v = await this._eval(node.expr, scope);
					scope.add(node.name, v);
					this.scope.add(ns.name + ':' + node.name, v);
					break;
				}

				case 'ns': {
					break; // TODO
				}

				default: {
					throw new Error('invalid ns member type: ' + (node as Ast.Node).type);
				}
			}
		}
	}

	@autobind
	private async _fn(fn: VFn, args: Value[]): Promise<Value> {
		if (fn.native) {
			const result = fn.native(args, {
				call: this._fn,
				registerAbortHandler: this.registerAbortHandler,
				unregisterAbortHandler: this.unregisterAbortHandler,
			});
			return result ?? NULL;
		} else {
			const _args = new Map() as Map<string, Value>;
			for (let i = 0; i < (fn.args ?? []).length; i++) {
				_args.set(fn.args![i]!, args[i]!);
			}
			const fnScope = fn.scope!.createChildScope(_args);
			return unWrapRet(await this._run(fn.statements!, fnScope));
		}
	}

	@autobind
	private async _eval(node: Ast.Node, scope: Scope): Promise<Value> {
		if (this.stop) return NULL;
		if (this.stepCount % IRQ_RATE === IRQ_AT) await new Promise(resolve => setTimeout(resolve, 5));
		this.stepCount++;
		if (this.opts.maxStep && this.stepCount > this.opts.maxStep) {
			throw new RuntimeError('max step exceeded');
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
							[node.var!, NUM(i)],
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
						[node.var, item],
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
				scope.add(node.name, value);
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

			case 'arr': return ARR(await Promise.all(node.value.map(async item => await this._eval(item, scope))));

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
				} else if (isNumber(target)) {
					if (Object.hasOwn(PRIMITIVE_PROPS.num, node.name)) {
						return PRIMITIVE_PROPS.num[node.name as keyof typeof PRIMITIVE_PROPS['num']](target);
					} else {
						throw new RuntimeError(`No such prop (${node.name}) in ${target.type}.`);
					}
				} else if (isString(target)) {
					if (Object.hasOwn(PRIMITIVE_PROPS.str, node.name)) {
						return PRIMITIVE_PROPS.str[node.name as keyof typeof PRIMITIVE_PROPS['str']](target);
					} else {
						throw new RuntimeError(`No such prop (${node.name}) in ${target.type}.`);
					}
				} else if (isArray(target)) {
					if (Object.hasOwn(PRIMITIVE_PROPS.arr, node.name)) {
						return PRIMITIVE_PROPS.arr[node.name as keyof typeof PRIMITIVE_PROPS['arr']](target);
					} else {
						throw new RuntimeError(`No such prop (${node.name}) in ${target.type}.`);
					}
				} else {
					throw new RuntimeError(`Cannot read prop (${node.name}) of ${target.type}.`);
				}
			}

			case 'index': {
				const target = await this._eval(node.target, scope);
				assertArray(target);
				const i = await this._eval(node.index, scope);
				assertNumber(i);
				const item = target.value[i.value];
				if (item === undefined) {
					throw new IndexOutOfRangeError(`Index out of range. index: ${i.value} max: ${target.value.length - 1}`);
				}
				return item;
			}

			case 'not': {
				const v = await this._eval(node.expr, scope);
				assertBoolean(v);
				return BOOL(!v.value);
			}

			case 'fn': {
				return FN(node.args.map(arg => arg.name), node.children, scope);
			}

			case 'block': {
				return this._run(node.statements, scope.createChildScope());
			}

			case 'tmpl': {
				let str = '';
				for (const x of node.tmpl) {
					if (typeof x === 'string') {
						str += x;
					} else {
						// TODO: Core:to_strと処理を共通化する
						const v = await this._eval(x, scope);
						let text = '';
						if (v.type === 'str') text = v.value;
						else if (v.type === 'num') text = v.value.toString();
						str += text;
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
			assertArray(assignee);

			const i = await this._eval(dest.index, scope);
			assertNumber(i);

			assignee.value[i.value] = value; // TODO: 存在チェック
		} else if (dest.type === 'prop') {
			const assignee = await this._eval(dest.target, scope);
			assertObject(assignee);

			assignee.value.set(dest.name, value);
		} else {
			throw new RuntimeError('The left-hand side of an assignment expression must be a variable or a property/index access.');
		}
	}
}
