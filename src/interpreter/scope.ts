import autobind from 'autobind-decorator';
import { Value } from '..';
import { AiScriptError } from './error';

export class Scope {
	private layerdStates: Record<string, Value>[];
	public name: string;

	constructor(layerdStates: Scope['layerdStates'] = [], name?: Scope['name']) {
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
