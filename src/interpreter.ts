/**
 * AiScript interpreter
 */

import autobind from 'autobind-decorator';
import { Value, Node, NULL } from '.';
import { nodeToString, valToString } from './util';

class AiScriptError extends Error {
	public info?: any;

	constructor(message: string, info?: any) {
		super(message);

		this.info = info;

		// Maintains proper stack trace for where our error was thrown (only available on V8)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, AiScriptError);
		}
	}
}

class Scope {
	private layerdStates: Record<string, Value>[];
	public name: string;

	constructor(layerdStates: Scope['layerdStates'], name?: Scope['name']) {
		this.layerdStates = layerdStates;
		this.name = name || (layerdStates.length === 1 ? '<root>' : '<anonymous>');
	}

	@autobind
	public createChildScope(states: Record<string, Value> = {}, name?: Scope['name']): Scope {
		const layer = [states, ...this.layerdStates];
		return new Scope(layer, name);
	}

	/**
	 * 指定した名前の変数を取得します
	 * @param name 変数名
	 */
	@autobind
	public get(name: string): Value {
		for (const later of this.layerdStates) {
			const state = later[name];
			if (state !== undefined) {
				return state;
			}
		}

		throw new AiScriptError(
			`No such variable '${name}' in scope '${this.name}'`, {
				scope: this.layerdStates
			});
	}

	/**
	 * 指定した名前の変数を現在のスコープに追加します
	 * @param name 変数名
	 */
	@autobind
	public add(name: string, val: Value) {
		this.layerdStates[0][name] = val;
	}
}

type Result = {
	value: Value;
	return: boolean;
};

function evalExp(node: Node, scope: Scope): Result {
	console.log(`\t\t\t + ${nodeToString(node)}`);

	switch (node.type) {
		case 'call': {
			const val = scope.get(node.name);
			if (val.type !== 'function') throw new AiScriptError(`#${node.name} is not a function (${val.type})`);
			if (val.native) {
				const result = val.native!(node.args.map(expr => evalExp(expr, scope).value));
				return { value: result || NULL, return: false };
			} else {
				const args = {} as Record<string, any>;
				for (let i = 0; i < val.args!.length; i++) {
					args[val.args![i]] = evalExp(node.args[i], scope).value;
				}
				// TODO: 関数のstatementsのスコープは、関数が呼ばれた場所じゃなく関数が定義された場所のスコープにする(クロージャ)
				const fnScope = scope.createChildScope(args, `#${node.name}`);
				return runBlock(val.statements!, fnScope);
			}
		}

		case 'if': {
			const cond = evalExp(node.cond, scope).value;
			if (cond.type !== 'boolean') throw new AiScriptError(`IF is expected boolean for cond, but got ${cond.type}`);
			if (cond.value) {
				return runBlock(node.then, scope.createChildScope());
			} else {
				if (node.elseif && node.elseif.length > 0) {
					for (const elseif of node.elseif) {
						const cond = evalExp(elseif.cond, scope).value;
						if (cond.type !== 'boolean') throw new AiScriptError(`ELSE IF is expected boolean for cond, but got ${cond.type}`);
						if (cond.value) {
							return runBlock(elseif.then, scope.createChildScope());
						}
					}
				} else if (node.else) {
					return runBlock(node.else, scope.createChildScope());
				}
			}
			return { value: NULL, return: false };
		}

		case 'def': {
			scope.add(node.name, evalExp(node.expr, scope).value);
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
				},
				return: false
			};
		}
	
		default: {
			throw new Error('unknown ast type: ' + node.type);
		}
	}
}

function runBlock(program: Node[], scope: Scope): Result {
	console.log(`\t\t\t-> ${scope.name}`);

	let v: Result = { value: NULL, return: false };
	
	for (let i = 0; i < program.length; i++) {
		const node = program[i];

		switch (node.type) {
			case 'return': {
				const val = evalExp(node.expr, scope);
				console.log(`\t\t\t<- ${scope.name} : ${valToString(val.value)}`);
				return { value: val.value, return: true };
			}

			default: {
				v = evalExp(node, scope);
				if (v.return) return v;
				break;
			}
		}
	}

	return { value: v.value, return: false };
}

export function run(script: Node[], vars: Record<string, Value>, maxStep: number = 1000) {
	let steps = 0;
	const scope = new Scope([vars]);

	const result = runBlock(script, scope);

	if (result) {
		console.log(`\t\t\t<- ${scope.name} : ${valToString(result.value)}`);
	} else {
		console.log(`\t\t\t<- ${scope.name}`);
	}
}
