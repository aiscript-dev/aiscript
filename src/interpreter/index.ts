/**
 * AiScript interpreter
 */

import autobind from 'autobind-decorator';
import { Scope } from './scope';
import { AiScriptError } from './error';
import { std } from './lib/std';
import { assertNumber, assertString, assertFunction, assertBoolean, assertObject, assertArray } from './util';
import { Value, NULL, RETURN, unWrapRet, FN_NATIVE, BOOL, NUM, STR, ARR, OBJ, FN, VFn } from './value';
import { Node } from './node';

export class AiScript {
	private vars: Record<string, Value>;
	private opts: {
		in?(q: string): Promise<string>;
		out?(value: Value): void;
		log?(type: string, params: Record<string, any>): void;
		maxStep?: number;
	};
	private stepCount = 0;
	public scope: Scope;

	constructor(vars: AiScript['vars'], opts?: AiScript['opts']) {
		this.opts = opts || {};

		this.vars = { ...vars, ...std, ...{
			print: FN_NATIVE(args => {
				if (this.opts.out) this.opts.out(args[0]);
			}),
			readline: FN_NATIVE(args => {
				const q = args[0];
				assertString(q);
				if (this.opts.in == null) return NULL;
				return new Promise(ok => {
					this.opts.in!(q.value).then(a => {
						ok({
							type: 'str',
							value: a
						});
					});
				});
			})
		} };

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

		const result = await this._run(script, this.scope);

		this.log('end', { val: result });
	}

	@autobind
	public async execFn(fn: VFn, args: Value[]) {
		return this._fn(fn, args);
	}

	@autobind
	private log(type: string, params: Record<string, any>) {
		if (this.opts.log) this.opts.log(type, params);
	}

	@autobind
	private async _fn(fn: VFn, args: Value[]): Promise<Value> {
		if (fn.native) {
			const result = await Promise.resolve(fn.native!(args, this._fn));
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
					return this._run(node.then, scope.createChildScope());
				} else {
					if (node.elseif && node.elseif.length > 0) {
						for (const elseif of node.elseif) {
							const cond = await this._eval(elseif.cond, scope);
							assertBoolean(cond);
							if (cond.value) {
								return this._run(elseif.then, scope.createChildScope());
							}
						}
						if (node.else) {
							return this._run(node.else, scope.createChildScope());
						}
					} else if (node.else) {
						return this._run(node.else, scope.createChildScope());
					}
				}
				return NULL;
			}

			case 'for': {
				const from = await this._eval(node.from, scope);
				const to = await this._eval(node.to, scope);
				assertNumber(from);
				assertNumber(to);
				for (let i = from.value + 1; i < to.value + 1; i++) {
					await this._run(node.s, scope.createChildScope(new Map([
						[node.var, { type: 'num', value: i }]
					])));
				}
				return NULL;
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
		
			default: {
				throw new Error('unknown ast type: ' + node.type);
			}
		}
	}

	@autobind
	private async _run(program: Node[], scope: Scope): Promise<Value> {
		this.log('block:enter', { scope: scope.name });

		let v: Value = NULL;
		
		for (let i = 0; i < program.length; i++) {
			const node = program[i];

			switch (node.type) {
				case 'return': {
					const val = await this._eval(node.expr, scope);
					this.log('block:return', { scope: scope.name, val: val });
					return RETURN(val);
				}

				default: {
					v = await this._eval(node, scope);
					if (v.type === 'return') {
						this.log('block:return', { scope: scope.name, val: v.value });
						return v;
					}
					break;
				}
			}
		}

		this.log('block:leave', { scope: scope.name, val: v });
		return v;
	}
}
