/*
 * このコードではJavaScriptの反復処理プロトコル及びジェネレーター関数を利用しています。
 * 詳細は https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Statements/function*
 * を参照して下さい。
 */

import { serialize, deserialize } from './serial-expression.js';
import { NULL } from './value.js';
import type { SeriExpToken } from './serial-expression.js';
import type { Value } from './value.js';

// TODO: 同時書き込みが発生した場合の衝突の解決
export class DicNode {
	private data?: Value;
	private children = new Map<SeriExpToken, DicNode>();

	constructor(kvs?: [Value, Value][]) {
		if (!kvs) return;
		for (const [key, val] of kvs) this.set(key, val);
	}

	get(key: Value): Value {
		return this.getRaw(serialize(key)) ?? NULL; // キーが見つからなかった場合の挙動を変えやすいように設計しています
	}
	has(key: Value): boolean {
		return this.getRaw(serialize(key)) ? true : false;
	}
	getRaw(keyGen: Generator<SeriExpToken, void, undefined>): Value | undefined {
		const { value: key, done } = keyGen.next();
		if (done) return this.data;
		else return this.children.get(key)?.getRaw(keyGen);
	}

	set(key: Value, val: Value): void {
		this.setRaw(serialize(key), val);
	}
	setRaw(keyGen: Generator<SeriExpToken, void, undefined>, val: Value): void {
		const { value: key, done } = keyGen.next();
		if (done) this.data = val;
		else {
			if (!this.children.has(key)) this.children.set(key, new DicNode());
			this.children.get(key)!.setRaw(keyGen, val);
		}
	}

	*kvs(): Generator<[Value, Value], void, undefined> {
		for (const [seriExp, val] of this.serializedKvs()) {
			yield [deserialize(seriExp), val];
		}
	}
	*serializedKvs(keyPrefix?: SeriExpToken[]): Generator<[SeriExpToken[], Value], void, undefined> {
		const kp = keyPrefix ?? [];
		if (this.data) yield [kp, this.data];
		for (const [key, childNode] of this.children) {
			yield* childNode.serializedKvs([...kp, key]);
		}
	}
}
