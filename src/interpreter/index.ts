/**
 * AiScript interpreter
 */

import autobind from 'autobind-decorator';
import { Scope } from './scope';
import { AiScriptError } from './error';
import { std } from './lib/std';
import { assertNumber, assertString, assertFunction, assertBoolean, assertObject, assertArray, eq } from './util';
import { Value, NULL, RETURN, unWrapRet, FN_NATIVE, BOOL, NUM, STR, ARR, OBJ, FN, VFn } from './value';
import { Node, NNs } from './node';

export class AiScript {
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
	private abortHandlers: Function[] = [];

	constructor(vars: AiScript['vars'], opts?: AiScript['opts']) {
		this.opts = opts || {};

		const io = {
			print: FN_NATIVE(args => {
				if (this.opts.out) this.opts.out(args[0]);
			}),
			readline: FN_NATIVE(async args => {
				const q = args[0];
				assertString(q);
				if (this.opts.in == null) return NULL;
				const a = await this.opts.in!(q.value);
				return STR(a);
			})
		};

		this.vars = { ...vars, ...std, ...io };

		this.scope = new Scope([new Map(Object.entries(this.vars))]);
		this.scope.opts.log = (type, params) => {
			switch (type) {
				case 'add': this.log('var:add', params); break;
				case 'read': this.log('var:read', params); break;
				case 'write': this.log('var:write', params); break;
				default: break;
			}
		};
	}

	@autobind
	public async exec(script?: Node[]) {
		if (script == null || script.length === 0) return;

		await this.collectNs(script);

		const result = await this._run(script, this.scope);

		this.log('end', { val: result });
	}

	@autobind
	public async execFn(fn: VFn, args: Value[]) {
		return this._fn(fn, args);
	}

	@autobind
	public static collectMetadata(script?: Node[]) {
		if (script == null || script.length === 0) return;

		function nodeToJs(node: Node): any {
			switch (node.type) {
				case 'arr': return node.value.map(item => nodeToJs(item));
				case 'bool': return node.value;
				case 'null': return null;
				case 'num': return node.value;
				case 'obj': {
					const obj = {};
					for (const [k, v] of node.value.entries()) {
						// TODO: keyが__proto__とかじゃないかチェック
						obj[k] = nodeToJs(v);
					}
					return obj;
				}
				case 'str': return node.value;
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
	private log(type: string, params: Record<string, any>) {
		if (this.opts.log) this.opts.log(type, params);
	}

	@autobind
	private async collectNs(script: Node[]) {
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
	private async collectNsMember(ns: NNs) {
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
					throw new Error('invalid ns member type: ' + node.type);
				}
			}
		}
	}

	@autobind
	private async _fn(fn: VFn, args: Value[]): Promise<Value> {
		if (fn.native) {
			const result = await Promise.resolve(fn.native!(args, {
				call: this._fn,
				registerAbortHandler: this.registerAbortHandler,
				unregisterAbortHandler: this.unregisterAbortHandler,
			}));
			return result || NULL;
		} else {
			const _args = new Map() as Map<string, any>;
			for (let i = 0; i < (fn.args || []).length; i++) {
				_args.set(fn.args![i], args[i]);
			}
			const fnScope = fn.scope!.createChildScope(_args);
			return unWrapRet(await this._run(fn.statements!, fnScope));
		}
	}

	@autobind
	private async _eval(node: Node, scope: Scope): Promise<Value> {
		if (this.stop) return NULL;
		this.log('node', { node: node });
		this.stepCount++;
		if (this.opts.maxStep && this.stepCount > this.opts.maxStep) {
			throw new AiScriptError('max step exceeded');
		}

		switch (node.type) {
			case 'call': {
				const val = scope.get(node.name);
				assertFunction(val);
				const args = await Promise.all(node.args.map(async expr => await this._eval(expr, scope)));
				return this._fn(val, args);
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

			case 'for': {
				let result: Value[] = [];
				if (node.times) {
					const times = await this._eval(node.times, scope);
					assertNumber(times);
					for (let i = 1; i < times.value + 1; i++) {
						const v = await this._eval(node.for, scope);
						result.push(v);
					}
				} else {
					const from = await this._eval(node.from!, scope);
					const to = await this._eval(node.to!, scope);
					assertNumber(from);
					assertNumber(to);
					for (let i = from.value + 1; i < to.value + 1; i++) {
						const v = await this._eval(node.for, scope.createChildScope(new Map([
							[node.var!, NUM(i)]
						])));
						result.push(v);
					}
				}
				return ARR(result);
			}

			case 'forOf': {
				let result: Value[] = [];
				const items = await this._eval(node.items!, scope);
				assertArray(items);
				for (const item of items.value) {
					const v = await this._eval(node.for, scope.createChildScope(new Map([
						[node.var!, item]
					])));
					result.push(v);
				}
				return ARR(result);
			}

			case 'def': {
				scope.add(node.name, await this._eval(node.expr, scope));
				return NULL;
			}

			case 'var': {
				return scope.get(node.name);
			}

			case 'assign': {
				scope.assign(node.name, await this._eval(node.expr, scope));
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
				const obj = scope.get(node.obj);
				let x = obj;
				for (const prop of node.path) {
					assertObject(x);
					if (!x.value.has(prop)) {
						x = NULL;
						break;
					} else {
						x = x.value.get(prop)!;
					}
				}
				return x;
			}

			case 'propCall': {
				const obj = scope.get(node.obj);
				let x = obj;
				for (const prop of node.path) {
					assertObject(x);
					if (!x.value.has(prop)) {
						x = NULL;
						break;
					} else {
						x = x.value.get(prop)!;
					}
				}
				assertFunction(x);
				const args = await Promise.all(node.args.map(async expr => await this._eval(expr, scope)));
				return this._fn(x, args);
			}

			case 'index': {
				const arr = scope.get(node.arr);
				assertArray(arr);
				const i = await this._eval(node.i, scope);
				assertNumber(i);
				return arr.value[i.value - 1]; // TODO: 存在チェック
			}

			case 'fn': {
				return FN(node.args!, node.children!, scope);
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

			case 'ns': {
				return NULL; // nop
			}

			case 'meta': {
				return NULL; // nop
			}
		}
	}

	@autobind
	private async _run(program: Node[], scope: Scope): Promise<Value> {
		this.log('block:enter', { scope: scope.name });

		let v: Value = NULL;
		
		for (let i = 0; i < program.length; i++) {
			const node = program[i];

			v = await this._eval(node, scope);
			if (v.type === 'return') {
				this.log('block:return', { scope: scope.name, val: v.value });
				return v;
			}
		}

		this.log('block:leave', { scope: scope.name, val: v });
		return v;
	}
	
	@autobind
	public registerAbortHandler(handler: Function) {
		this.abortHandlers.push(handler);
	}

	@autobind
	public unregisterAbortHandler(handler: Function) {
		this.abortHandlers = this.abortHandlers.filter(h => h != handler);
	}

	@autobind
	public abort() {
		this.stop = true;
		for (const handler of this.abortHandlers) {
			handler();
		}
		this.abortHandlers = [];
	}
}
