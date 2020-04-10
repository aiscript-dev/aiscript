/**
 * AiScript interpreter
 */

import { Scope } from './scope';
import { AiScriptError } from './error';
import { core as libCore } from './lib/core';
import { std as libStd } from './lib/std';
import { assertNumber, assertString, assertFunction, assertBoolean, assertObject, assertArray } from './util';
import { Value, NULL } from './value';
import { Node } from './node';

type Result = {
	value: Value;
	return: boolean;
};

export class AiScript {
	private vars: Record<string, Value>;
	private opts: {
		in?(q: string): Promise<string>;
		out?(value: Value): void;
		log?(type: string, params: Record<string, any>): void;
	};

	constructor(vars: AiScript['vars'], opts?: AiScript['opts']) {
		this.vars = { ...vars, ...libCore, ...libStd, ...{
			print: {
				type: 'fn',
				native: (args) => {
					if (this.opts.out) this.opts.out(args[0]);
				},
			},
			readline: {
				type: 'fn',
				native: (args) => {
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
				},
			},
		} };
		this.opts = opts || {};
	}

	public async exec(script?: Node[]) {
		if (script == null || script.length === 0) return;

		let steps = 0;
		const scope = new Scope([this.vars]);
		scope.opts.log = (type, params) => {
			switch (type) {
				case 'add': this.log('var:add', params); break;
				case 'read': this.log('var:read', params); break;
				case 'write': this.log('var:write', params); break;
				default: break;
			}
		};
	
		const result = await this.runBlock(script, scope);

		this.log('end', { val: result.value });
	}

	private log(type: string, params: Record<string, any>) {
		if (this.opts.log) this.opts.log(type, params);
	}

	private async evalExp(node: Node, scope: Scope): Promise<Result> {
		this.log('node', { node: node });

		switch (node.type) {
			case 'call': {
				const val = scope.get(node.name);
				assertFunction(val);
				if (val.native) {
					const result = await Promise.resolve(val.native!(await Promise.all(node.args.map(async expr => (await this.evalExp(expr, scope)).value))));
					return { value: result || NULL, return: false };
				} else {
					const args = {} as Record<string, any>;
					for (let i = 0; i < val.args!.length; i++) {
						args[val.args![i]] = (await this.evalExp(node.args[i], scope)).value;
					}
					const fnScope = val.scope!.createChildScope(args, `#${node.name}`);
					return this.runBlock(val.statements!, fnScope);
				}
			}

			case 'if': {
				const cond = (await this.evalExp(node.cond, scope)).value;
				assertBoolean(cond);
				if (cond.value) {
					return this.runBlock(node.then, scope.createChildScope());
				} else {
					if (node.elseif && node.elseif.length > 0) {
						for (const elseif of node.elseif) {
							const cond = (await this.evalExp(elseif.cond, scope)).value;
							assertBoolean(cond);
							if (cond.value) {
								return this.runBlock(elseif.then, scope.createChildScope());
							}
						}
						if (node.else) {
							return this.runBlock(node.else, scope.createChildScope());
						}
					} else if (node.else) {
						return this.runBlock(node.else, scope.createChildScope());
					}
				}
				return { value: NULL, return: false };
			}

			case 'for': {
				const from = (await this.evalExp(node.from, scope)).value;
				const to = (await this.evalExp(node.to, scope)).value;
				assertNumber(from);
				assertNumber(to);
				for (let i = from.value + 1; i < to.value + 1; i++) {
					await this.runBlock(node.s, scope.createChildScope({
						[node.var]: { type: 'num', value: i }
					}));
				}
				return { value: NULL, return: false };
			}

			case 'def': {
				scope.add(node.name, (await this.evalExp(node.expr, scope)).value);
				return { value: NULL, return: false };
			}

			case 'var': {
				return { value: scope.get(node.name), return: false };
			}

			case 'bool': {
				return {
					value: {
						type: 'bool',
						value: node.value
					},
					return: false
				};
			}

			case 'num': {
				return {
					value: {
						type: 'num',
						value: node.value
					},
					return: false
				};
			}

			case 'str': {
				return {
					value: {
						type: 'str',
						value: node.value
					},
					return: false
				};
			}

			case 'arr': {
				return {
					value: {
						type: 'arr',
						value: await Promise.all(node.value.map(async item => (await this.evalExp(item, scope)).value))
					},
					return: false
				};
			}

			case 'obj': {
				const obj = {} as Record<string, Value>;
				for (const k of Object.keys(node.value)) {
					obj[k] = (await this.evalExp(node.value[k], scope)).value;
				}
				return {
					value: {
						type: 'obj',
						value: obj
					},
					return: false
				};
			}

			case 'prop': {
				const obj = scope.get(node.obj);
				let x = obj;
				for (const prop of node.path) {
					assertObject(x);
					x = x.value[prop];
					if (x === undefined) {
						x = NULL;
						break;
					}
				}
				return {
					value: x,
					return: false
				};
			}

			case 'index': {
				const arr = scope.get(node.arr);
				assertArray(arr);
				const i = (await this.evalExp(node.i, scope)).value;
				assertNumber(i);
				return {
					value: arr.value[i.value - 1], // TODO: 存在チェック
					return: false
				};
			}

			case 'fn': {
				return {
					value: {
						type: 'fn',
						args: node.args!,
						statements: node.children!,
						scope: scope
					},
					return: false
				};
			}
		
			default: {
				throw new Error('unknown ast type: ' + node.type);
			}
		}
	}

	private async runBlock(program: Node[], scope: Scope): Promise<Result> {
		this.log('block:enter', { scope: scope.name });

		let v: Result = { value: NULL, return: false };
		
		for (let i = 0; i < program.length; i++) {
			const node = program[i];

			switch (node.type) {
				case 'return': {
					const val = await this.evalExp(node.expr, scope);
					this.log('block:return', { scope: scope.name, val: val.value });
					return { value: val.value, return: true };
				}

				default: {
					v = await this.evalExp(node, scope);
					if (v.return) {
						this.log('block:return', { scope: scope.name, val: v.value });
						return v;
					}
					break;
				}
			}
		}

		this.log('block:leave', { scope: scope.name, val: v.value });
		return { value: v.value, return: false };
	}
}
