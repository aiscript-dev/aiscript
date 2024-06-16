/*
 * Serialization and deserialization of aiscript Value for uses in dictionaries (and sets, in future).
 */

/*
 * このコードではJavaScriptのジェネレーター関数を利用しています。
 * 詳細は https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Statements/function*
 * を参照して下さい。
 */

// TODO: ループ構造対策

import { mustBeNever } from '../utils/mustbenever.js';
import { NULL, BOOL, NUM, STR, ARR, OBJ, DIC, ERROR, RETURN, BREAK, CONTINUE } from './value.js';
import { DicNode } from './dic.js';
import type { Value, VFn } from './value.js';

export type SeriExpToken = 
	| null
	| boolean
	| number
	| string
	| VFn
	| typeof SeriExpSymbols[keyof typeof SeriExpSymbols]
;

export const SeriExpSymbols = {
	break: Symbol('SeriExpSymbols.break'),
	continue: Symbol('SeriExpSymbols.continue'),
	error: Symbol('SeriExpSymbols.error'),
	return: Symbol('SeriExpSymbols.return'),
	arr: Symbol('SeriExpSymbols.arr'),
	obj: Symbol('SeriExpSymbols.obj'),
	dic: Symbol('SeriExpSymbols.dic'),
	end: Symbol('SeriExpSymbols.end'),
};

export function* serialize(val: Value): Generator<SeriExpToken, void, undefined> {
	switch (val.type) {
		case 'null':
			yield null;
			break;
		case 'bool':
		case 'num':
		case 'str':
			yield val.value;
			break;
		case 'fn':
			yield val; // nativeを比較する処理はdeserialize時に新しいNATIVE_FNオブジェクトを生成しなければならないというコストを鑑み廃止しました
			break;
		case 'break':
		case 'continue':
			yield SeriExpSymbols[val.type];
			break;
		case 'return':
			yield SeriExpSymbols[val.type];
			yield* serialize(val.value);
			break;
		case 'error':
			yield SeriExpSymbols[val.type];
			yield* serialize(val.info ?? NULL);
			break;
		case 'arr':
			yield SeriExpSymbols[val.type];
			for (const v of val.value) yield* serialize(v);
			yield SeriExpSymbols.end;
			break;
		case 'obj':
			yield SeriExpSymbols[val.type];
			for (const [k, v] of val.value) {
				yield k;
				yield* serialize(v);
			}
			yield SeriExpSymbols.end;
			break;
		case 'dic':
			yield SeriExpSymbols[val.type];
			for (const [k, v] of val.value.serializedKvs()) {
				yield* k as Iterable<SeriExpToken>; // it's array actually
				yield* serialize(v);
			}
			yield SeriExpSymbols.end;
			break;
		default:
			mustBeNever(val, 'serializing unknown type');
	}
}

const END = Symbol('end token of serial expression');

export function deserialize(seriExp: Iterable<SeriExpToken> | Iterator<SeriExpToken>): Value {
	return deserializeInnerValue((seriExp as any)[Symbol.iterator] ? (seriExp as Iterable<SeriExpToken>)[Symbol.iterator]() : seriExp as Iterator<SeriExpToken>);
}

function deserializeInnerValue(iterator: Iterator<SeriExpToken>): Value {
	const result = deserializeInnerValueOrEnd(iterator);
	if (typeof result === 'symbol') throw new Error('unexpected value of serial expression: ' + result.description);
	else return result;
}

function deserializeInnerValueOrEnd(iterator: Iterator<SeriExpToken>): Value | typeof END {
	const { value: token, done } = iterator.next();
	if (done) throw new Error('unexpected end of serial expression');
	const nextValue = () => deserializeInnerValue(iterator);
	const nextValueOrEnd = () => deserializeInnerValueOrEnd(iterator);
	const nextString = () => {
		const token = nextStringOrEnd();
		if (typeof token !== 'string') throw new Error('unexpected token of serial expression: end');
		return token;
	};
	const nextStringOrEnd = () => {
		const { value: token, done } = iterator.next();
		if (done) throw new Error('unexpected end of serial expression');
		if (token !== SeriExpSymbols.end || typeof token !== 'string') throw new Error(`unexpected token of serial expression: ${token as string}`);
		return token;
	};

	switch (typeof token) {
		case 'boolean': return BOOL(token);
		case 'number': return NUM(token);
		case 'string': return STR(token);
		case 'object':
			if (token === null) return NULL;
			if (token.type === 'fn') return token;
	}

	if (typeof token !== 'symbol') {
		// 網羅性チェック、何故かVFnが残っている
		mustBeNever<VFn>(token, `unknown SeriExpToken type: ${token}`);
	}

	switch (token) {
		case SeriExpSymbols.break: return BREAK();
		case SeriExpSymbols.continue: return CONTINUE();
		case SeriExpSymbols.return: return RETURN(nextValue());
		case SeriExpSymbols.error: return ERROR(
			nextString(),
			nextValue(),
		);
		case SeriExpSymbols.arr: {
			const elems: Value[] = [];
			while (true) {
				const valueOrEnd = nextValueOrEnd();
				if (valueOrEnd === END) return ARR(elems);
				elems.push(valueOrEnd);
			}
		}
		case SeriExpSymbols.obj: {
			const elems = new Map<string, Value>();
			while (true) {
				const key = nextStringOrEnd();
				if (key === SeriExpSymbols.end) return OBJ(elems);
				elems.set(key, nextValue());
			}
		}
		case SeriExpSymbols.dic: {
			const elems = new DicNode();
			while (true) {
				const key = nextValueOrEnd();
				if (key === END) return DIC.fromNode(elems);
				elems.set(key, nextValue());
			}
		}
		case SeriExpSymbols.end: return END;
		default: throw new Error('unknown symbol in SeriExp');
	}
}
