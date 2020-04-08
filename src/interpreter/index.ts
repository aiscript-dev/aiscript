/**
 * AiScript interpreter
 */

import { Scope } from './scope';
import { AiScriptError } from './error';
import { core as libCore } from './lib/core';
import { std as libStd } from './lib/std';

type Result = {
	value: Value;
	return: boolean;
};

export class AiScript {
	private script: Node[];
	private vars: Record<string, Value>;
	private opts: {
		out?(value: Value): void;
		log?(type: string, params: Record<string, any>): void;
	};

	constructor(script: Node[], vars: Record<string, Value>, opts?: AiScript['opts']) {
		this.script = script;
		this.vars = { ...vars, ...libCore, ...libStd, ...{
			print: {
				type: 'function',
				native: (args) => {
					this.out(args[0]);
				},
			},
		} };
		this.opts = opts || {};
	}

	public exec() {
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
	
		const result = this.runBlock(this.script, scope);

		this.log('end', { val: result.value });
	}

	private out(value: Value) {
		if (this.opts.out) this.opts.out(value);
	}

	private log(type: string, params: Record<string, any>) {
		if (this.opts.log) this.opts.log(type, params);
	}

	private evalExp(node: Node, scope: Scope): Result {
		this.log('node', { node: node });

		switch (node.type) {
			case 'call': {
				const val = scope.get(node.name);
				if (val.type !== 'function') throw new AiScriptError(`#${node.name} is not a function (${val.type})`);
				if (val.native) {
					const result = val.native!(node.args.map(expr => this.evalExp(expr, scope).value));
					return { value: result || NULL, return: false };
				} else {
					const args = {} as Record<string, any>;
					for (let i = 0; i < val.args!.length; i++) {
						args[val.args![i]] = this.evalExp(node.args[i], scope).value;
					}
					const fnScope = val.scope!.createChildScope(args, `#${node.name}`);
					return this.runBlock(val.statements!, fnScope);
				}
			}

			case 'if': {
				const cond = this.evalExp(node.cond, scope).value;
				if (cond.type !== 'boolean') throw new AiScriptError(`IF is expected boolean for cond, but got ${cond.type}`);
				if (cond.value) {
					return this.runBlock(node.then, scope.createChildScope());
				} else {
					if (node.elseif && node.elseif.length > 0) {
						for (const elseif of node.elseif) {
							const cond = this.evalExp(elseif.cond, scope).value;
							if (cond.type !== 'boolean') throw new AiScriptError(`ELSE IF is expected boolean for cond, but got ${cond.type}`);
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

			case 'def': {
				scope.add(node.name, this.evalExp(node.expr, scope).value);
				return { value: NULL, return: false };
			}

			case 'var': {
				return { value: scope.get(node.name), return: false };
			}

			case 'number': {
				return {
					value: {
						type: 'number',
						value: node.value
					},
					return: false
				};
			}

			case 'string': {
				return {
					value: {
						type: 'string',
						value: node.value
					},
					return: false
				};
			}

			case 'func': {
				return {
					value: {
						type: 'function',
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

	private runBlock(program: Node[], scope: Scope): Result {
		this.log('block:enter', { scope: scope.name });

		let v: Result = { value: NULL, return: false };
		
		for (let i = 0; i < program.length; i++) {
			const node = program[i];

			switch (node.type) {
				case 'return': {
					const val = this.evalExp(node.expr, scope);
					this.log('block:return', { scope: scope.name, val: val.value });
					return { value: val.value, return: true };
				}

				default: {
					v = this.evalExp(node, scope);
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

type VNull = {
	type: 'null';
	value: null;
};

type VBoolean = {
	type: 'boolean';
	value: boolean;
};

type VNumber = {
	type: 'number';
	value: number;
};

type VString = {
	type: 'string';
	value: string;
};

type VFunction = {
	type: 'function';
	args?: string[];
	statements?: Node[];
	native?: (args: Value[]) => Value | void;
	scope?: Scope;
};

export type Value = VNull | VBoolean | VNumber | VString | VFunction;

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
	to: Node; // 終値
	children: Node[]; // 本体処理
} | {
	type: 'var'; // 変数
	name: string; // 変数名
} | {
	type: 'null'; // nullリテラル
	value: null; // null
} | {
	type: 'boolean'; // 真理値リテラル
	value: boolean; // 真理値
} | {
	type: 'number'; // 数値リテラル
	value: number; // 数値
} | {
	type: 'string'; // 文字列リテラル
	value: string; // 文字列
} | {
	type: 'func'; // 関数リテラル
	args: string[]; // 引数名
	children: Node[]; // 関数の本体処理
} | {
	type: 'object'; // オブジェクトリテラル
	object: {
		key: string; // キー
		value: Node; // バリュー(式)
	}[]; // オブジェクト
};

export const NULL = {
	type: 'null' as const,
	value: null
};
