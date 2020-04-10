/**
 * AiScript interpreter
 */

import { Scope } from './scope';
import { AiScriptError } from './error';
import { core as libCore } from './lib/core';
import { std as libStd } from './lib/std';
import { assertNumber, assertString, assertFunction, assertBoolean, assertObject } from './util';

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
				for (let i = from.value; i < to.value; i++) {
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
				const obj = (await this.evalExp(node.obj, scope)).value;
				assertObject(obj);
				return {
					value: obj.value[node.name],
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

export type VNull = {
	type: 'null';
	value: null;
};

export type VBool = {
	type: 'bool';
	value: boolean;
};

export type VNum = {
	type: 'num';
	value: number;
};

export type VStr = {
	type: 'str';
	value: string;
};

export type VArr = {
	type: 'arr';
	value: Value[];
};

export type VObj = {
	type: 'obj';
	value: Record<string, Value>;
};

export type VFn = {
	type: 'fn';
	args?: string[];
	statements?: Node[];
	native?: (args: Value[]) => Value | Promise<Value> | void;
	scope?: Scope;
};

export type Value = VNull | VBool | VNum | VStr | VArr | VObj | VFn;

export type Node = {
	type: 'def'; // 変数宣言
	name: string; // 変数名
	expr: Node; // 式
} | {
	type: 'call'; // 関数呼び出し
	name: string; // 関数名
	args: Node[]; // 引数(式の配列)
} | {
	type: 'return'; // return
	expr: Node; // 式
} | {
	type: 'if'; // if文
	cond: Node; // 条件式
	then: Node[]; // if文のthen節
	elseif: {
		cond: Node;
		then: Node[];
	}[]; // if文のelseif節
	else: Node[]; // if文のelse節
} | {
	type: 'for'; // for文
	var: string; // イテレータ変数名
	from: Node; // 開始値
	to: Node; // 終値
	s: Node[]; // 本体処理
} | {
	type: 'var'; // 変数
	name: string; // 変数名
} | {
	type: 'null'; // nullリテラル
	value: null; // null
} | {
	type: 'bool'; // 真理値リテラル
	value: boolean; // 真理値
} | {
	type: 'num'; // 数値リテラル
	value: number; // 数値
} | {
	type: 'str'; // 文字列リテラル
	value: string; // 文字列
} | {
	type: 'arr'; // 配列リテラル
	value: Node[]; // アイテム
} | {
	type: 'fn'; // 関数リテラル
	args: string[]; // 引数名
	children: Node[]; // 関数の本体処理
} | {
	type: 'obj'; // オブジェクトリテラル
	value: Record<string, Node>; // オブジェクト
} | {
	type: 'prop'; // プロパティアクセス
	name: string; // プロパティ名
	obj: Node; // オブジェクト
};

export const NULL = {
	type: 'null' as const,
	value: null
};

export const TRUE = {
	type: 'bool' as const,
	value: true
};

export const FALSE = {
	type: 'bool' as const,
	value: false
};

export const NUM = (num: number) => ({
	type: 'num' as const,
	value: num
});

export const STR = (str: string) => ({
	type: 'str' as const,
	value: str
});

export const BOOL = (bool: boolean) => ({
	type: 'bool' as const,
	value: bool
});
