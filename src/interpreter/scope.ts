import { autobind } from './decorators.js';
import { RuntimeError } from '../error.js';
import type { Value } from './value.js';

export class Scope {
	private parent?: Scope;
	private layerdStates: Map<string, Value>[];
	public name: string;
	public opts: {
		log?(type: string, params: Record<string, any>): void;
		onUpdated?(name: string, value: Value): void;
	} = {};

	constructor(layerdStates: Scope['layerdStates'] = [], parent?: Scope, name?: Scope['name']) {
		this.layerdStates = layerdStates;
		this.parent = parent;
		this.name = name || (layerdStates.length === 1 ? '<root>' : '<anonymous>');
	}

	@autobind
	private log(type: string, params: Record<string, any>): void {
		if (this.parent) {
			this.parent.log(type, params);
		} else {
			if (this.opts.log) this.opts.log(type, params);
		}
	}

	@autobind
	private onUpdated(name: string, value: Value): void {
		if (this.parent) {
			this.parent.onUpdated(name, value);
		} else {
			if (this.opts.onUpdated) this.opts.onUpdated(name, value);
		}
	}

	@autobind
	public createChildScope(states: Map<string, Value> = new Map(), name?: Scope['name']): Scope {
		const layer = [states, ...this.layerdStates];
		return new Scope(layer, this, name);
	}

	/**
	 * 指定した名前の変数を取得します
	 * @param name - 変数名
	 */
	@autobind
	public get(name: string): Value {
		for (const layer of this.layerdStates) {
			if (layer.has(name)) {
				const state = layer.get(name)!;
				this.log('read', { var: name, val: state });
				return state;
			}
		}

		throw new RuntimeError(
			`No such variable '${name}' in scope '${this.name}'`,
			{ scope: this.layerdStates });
	}

	/**
	 * 現在のスコープに存在する全ての変数を取得します
	 */
	@autobind
	public getAll(): Map<string, Value> {
		const vars = this.layerdStates.reduce((arr, layer) => {
			return [...arr, ...layer];
		}, [] as [string, Value][]);
		return new Map(vars);
	}

	/**
	 * 指定した名前の変数を現在のスコープに追加します
	 * @param name - 変数名
	 * @param val - 初期値
	 */
	@autobind
	public add(name: string, val: Value): void {
		this.log('add', { var: name, val: val });
		const states = this.layerdStates[0]!;
		if (states.has(name)) {
			throw new RuntimeError(
				`Variable '${name}' is alerady exists in scope '${this.name}'`,
				{ scope: this.layerdStates });
		}
		states.set(name, val);
		if (this.parent == null) this.onUpdated(name, val);
	}

	/**
	 * 指定した名前の変数に値を再代入します
	 * @param name - 変数名
	 * @param val - 値
	 */
	@autobind
	public assign(name: string, val: Value): void {
		let i = 1;
		for (const layer of this.layerdStates) {
			if (layer.has(name)) {
				layer.set(name, val);
				this.log('assign', { var: name, val: val });
				if (i === this.layerdStates.length) this.onUpdated(name, val);
				return;
			}
			i++;
		}

		throw new RuntimeError(
			`No such variable '${name}' in scope '${this.name}'`,
			{ scope: this.layerdStates });
	}
}
