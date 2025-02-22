import { autobind } from '../utils/mini-autobind.js';
import { AiScriptRuntimeError } from '../error.js';
import type { Value } from './value.js';
import type { Variable } from './variable.js';
import type { LogObject } from './index.js';

export type LayeredStates = [Map<string, Variable>, ...Map<string, Variable>[]]

export class Scope {
	private parent?: Scope;
	private layeredStates: LayeredStates;
	public name: string;
	public opts: {
		log?(type: string, params: LogObject): void;
		onUpdated?(name: string, value: Value): void;
	} = {};
	public nsName?: string;

	constructor(layeredStates: Scope['layeredStates'] = [new Map()], parent?: Scope, name?: Scope['name'], nsName?: string) {
		this.layeredStates = layeredStates;
		this.parent = parent;
		this.name = name || (layeredStates.length === 1 ? '<root>' : '<anonymous>');
		this.nsName = nsName;
	}

	@autobind
	private log(type: string, params: LogObject): void {
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
	public createChildScope(states: Map<string, Variable> = new Map(), name?: Scope['name']): Scope {
		const layer: LayeredStates = [states, ...this.layeredStates];
		return new Scope(layer, this, name);
	}

	@autobind
	public createChildNamespaceScope(nsName: string, states: Map<string, Variable> = new Map(), name?: Scope['name']): Scope {
		const layer: LayeredStates = [states, ...this.layeredStates];
		return new Scope(layer, this, name, nsName);
	}

	/**
	 * 指定した名前の変数を取得します
	 * @param name - 変数名
	 */
	@autobind
	public get(name: string): Value {
		for (const layer of this.layeredStates) {
			const value = layer.get(name);
			if (value) {
				const state = value.value;
				this.log('read', { var: name, val: state });
				return state;
			}
		}

		throw new AiScriptRuntimeError(
			`No such variable '${name}' in scope '${this.name}'`,
			{ scope: this.layeredStates });
	}

	/**
	 * 名前空間名を取得します。
	 */
	@autobind
	public getNsPrefix(): string {
		if (this.parent == null || this.nsName == null) return '';
		return this.parent.getNsPrefix() + this.nsName + ':';
	}

	/**
	 * 指定した名前の変数が存在するか判定します
	 * @param name - 変数名
	 */
	@autobind
	public exists(name: string): boolean {
		for (const layer of this.layeredStates) {
			if (layer.has(name)) {
				this.log('exists', { var: name });
				return true;
			}
		}

		this.log('not exists', { var: name });
		return false;
	}

	/**
	 * 現在のスコープに存在する全ての変数を取得します
	 */
	@autobind
	public getAll(): Map<string, Variable> {
		const vars = this.layeredStates.reduce((arr, layer) => {
			return [...arr, ...layer];
		}, [] satisfies [string, Variable][]);
		return new Map(vars);
	}

	/**
	 * 指定した名前の変数を現在のスコープに追加します。名前空間である場合は接頭辞を付して親のスコープにも追加します
	 * @param name - 変数名
	 * @param val - 初期値
	 */
	@autobind
	public add(name: string, variable: Variable): void {
		this.log('add', { var: name, val: variable });
		const states = this.layeredStates[0];
		if (states.has(name)) {
			throw new AiScriptRuntimeError(
				`Variable '${name}' already exists in scope '${this.name}'`,
				{ scope: this.layeredStates });
		}
		states.set(name, variable);
		if (this.parent == null) this.onUpdated(name, variable.value);
		else if (this.nsName != null) this.parent.add(this.nsName + ':' + name, variable);
	}

	/**
	 * 指定した名前の変数に値を再代入します
	 * @param name - 変数名
	 * @param val - 値
	 */
	@autobind
	public assign(name: string, val: Value): void {
		let i = 1;
		for (const layer of this.layeredStates) {
			const variable = layer.get(name);
			if (variable != null) {
				if (!variable.isMutable) {
					throw new AiScriptRuntimeError(`Cannot assign to an immutable variable ${name}.`);
				}

				variable.value = val;

				this.log('assign', { var: name, val: val });
				if (i === this.layeredStates.length) this.onUpdated(name, val);
				return;
			}
			i++;
		}

		throw new AiScriptRuntimeError(
			`No such variable '${name}' in scope '${this.name}'`,
			{ scope: this.layeredStates });
	}
}
