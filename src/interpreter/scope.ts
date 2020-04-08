import autobind from 'autobind-decorator';
import { Value } from '.';
import { AiScriptError } from './error';

export class Scope {
	private parent?: Scope;
	private layerdStates: Record<string, Value>[];
	public name: string;
	public opts: {
		log?(type: string, params: Record<string, any>): void;
	} = {};

	constructor(layerdStates: Scope['layerdStates'] = [], parent?: Scope, name?: Scope['name']) {
		this.layerdStates = layerdStates;
		this.parent = parent;
		this.name = name || (layerdStates.length === 1 ? '<root>' : '<anonymous>');
	}

	@autobind
	private log(type: string, params: Record<string, any>) {
		if (this.parent) {
			this.parent.log(type, params);
		} else {
			if (this.opts.log) this.opts.log(type, params);
		}
	}

	@autobind
	public createChildScope(states: Record<string, Value> = {}, name?: Scope['name']): Scope {
		const layer = [states, ...this.layerdStates];
		return new Scope(layer, this, name);
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
				this.log('read', { var: name, val: state });
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
		this.log('add', { var: name, val: val });
		this.layerdStates[0][name] = val;
	}
}
