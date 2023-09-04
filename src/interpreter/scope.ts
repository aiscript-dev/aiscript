import { autobind } from '../utils/mini-autobind.js';
import { RuntimeError } from '../error.js';
import type { Value } from './value.js';

export type GetVariableHandlerType = (scope: Scope, name: string) => Value | void
export type HasVariableHandlerType = (scope: Scope, name: string) => boolean | void
export type SetVariableHandlerType = (scope: Scope, name: string, newValue: Value) => boolean | void

export class Scope {
	private parent?: Scope;
	public name: string;
	public opts: {
		log?(type: string, params: Record<string, any>): void;
		onUpdated?(name: string, value: Value): void;
	} = {};

	private variables: Map<string, Value>;

	private getVariableHandlers = new Set<GetVariableHandlerType>();
	private hasVariableHandlers = new Set<HasVariableHandlerType>();
	private setVariableHandlers = new Set<SetVariableHandlerType>();

	constructor(variables = new Map<string, Value>(), parent?: Scope, name?: Scope['name']) {
		this.variables = variables;
		this.parent = parent;
		this.name = name || '<anonymous>';
	}

	public trace(): Scope[] {
		const res: Scope[] = [];

		// eslint-disable-next-line
		let scope: Scope | undefined = this;
		while (scope != null) {
			res.push(scope);
			scope = scope.parent;
		}

		return res;
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
	public createChildScope(variables = new Map<string, Value>(), name?: Scope['name']): Scope {
		return new Scope(variables, this, name);
	}

	/**
	 * 指定した名前の変数を取得します
	 * @param name - 変数名
	 */
	@autobind
	public get(name: string): Value {
		for (const handler of this.getVariableHandlers) {
			const res = handler(this, name);
			if (res != null) return res;
		}

		if (this.variables.has(name)) {
			this.log('read', { var: name, val: this.variables });
			return this.variables.get(name)!;
		} else if (this.parent?.exists(name)) {
			return this.parent.get(name);
		}

		throw new RuntimeError(
			`No such variable '${name}' in scope '${this.name}'`,
			{ scope: this.trace() });
	}

	/**
	 * 指定した名前の変数が存在するか判定します
	 * @param name - 変数名
	 */
	@autobind
	public exists(name: string): boolean {
		for (const handler of this.hasVariableHandlers) {
			const res = handler(this, name);
			if (res != null) return res;
		}

		if (this.variables.has(name)) {
			this.log('exists', { var: name });
			return true;
		} else if (this.parent?.exists(name)) {
			return true;
		}

		this.log('not exists', { var: name });
		return false;
	}

	/**
	 * 現在のスコープに存在する全ての変数を取得します
	 */
	@autobind
	public getAll(): Map<string, Value> {
		const vars = this.trace().reduce((arr, layer) => {
			return [...arr, ...layer.variables];
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
		if (this.exists(name)) {
			throw new RuntimeError(
				`Variable '${name}' is alerady exists in scope '${this.name}'`,
				{ scope: this.trace() });
		}

		for (const handler of this.setVariableHandlers) {
			handler(this, name, val);
			return;
		}

		this.variables.set(name, val);
		if (this.parent == null) this.onUpdated(name, val);
	}

	/**
	 * 指定した名前の変数に値を再代入します
	 * @param name - 変数名
	 * @param val - 値
	 */
	@autobind
	public assign(name: string, val: Value): void {
		let isManualMode = false;
		for (const handler of this.setVariableHandlers) {
			isManualMode = !!handler(this, name, val);
		}

		if (isManualMode) return;

		if (this.variables.has(name)) {
			this.variables.set(name, val);
			return;
		} else if (this.parent?.exists(name)) {
			return this.parent.assign(name, val);
		}

		throw new RuntimeError(
			`No such variable '${name}' in scope '${this.name}'`,
			{ scope: this.trace() });
	}

	/**
	 * 変数が参照される際の動作を上書きするイベントハンドラーを登録します。
	 * @param handler - 返り値が `null` なら動作を次のハンドラーへスキップします
	 */
	@autobind
	public addGetVariableHandler(handler: GetVariableHandlerType): void {
		this.getVariableHandlers.add(handler);
	}

	/**
	 * 変数が定義されているか確認する際の動作を上書きするイベントハンドラーを登録します。
	 * @param handler - 返り値が `null` なら動作を次のハンドラーへスキップします
	 */
	@autobind
	public addHasVariableHandler(handler: HasVariableHandlerType): void {
		this.hasVariableHandlers.add(handler);
	}

	/**
	 * 変数が変更される際の動作を上書きするイベントハンドラーを登録します。
	 * @param handler - 返り値が `true` ならScope自体が行う動作をスキップします
	 */
	@autobind
	public addSetVariableHandler(handler: SetVariableHandlerType): void {
		this.setVariableHandlers.add(handler);
	}
}
