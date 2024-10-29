import { AiScriptRuntimeError } from '../error.js';
import { STR, NUM, ARR, OBJ, NULL, BOOL } from './value.js';
import type { Value, VStr, VNum, VBool, VFn, VObj, VArr } from './value.js';

export function expectAny(val: Value | null | undefined): asserts val is Value {
	if (val == null) {
		throw new AiScriptRuntimeError('Expect anything, but got nothing.');
	}
}

export function assertBoolean(val: Value | null | undefined): asserts val is VBool {
	if (val == null) {
		throw new AiScriptRuntimeError('Expect boolean, but got nothing.');
	}
	if (val.type !== 'bool') {
		throw new AiScriptRuntimeError(`Expect boolean, but got ${val.type}.`);
	}
}

export function assertFunction(val: Value | null | undefined): asserts val is VFn {
	if (val == null) {
		throw new AiScriptRuntimeError('Expect function, but got nothing.');
	}
	if (val.type !== 'fn') {
		throw new AiScriptRuntimeError(`Expect function, but got ${val.type}.`);
	}
}

export function assertString(val: Value | null | undefined): asserts val is VStr {
	if (val == null) {
		throw new AiScriptRuntimeError('Expect string, but got nothing.');
	}
	if (val.type !== 'str') {
		throw new AiScriptRuntimeError(`Expect string, but got ${val.type}.`);
	}
}

export function assertNumber(val: Value | null | undefined): asserts val is VNum {
	if (val == null) {
		throw new AiScriptRuntimeError('Expect number, but got nothing.');
	}
	if (val.type !== 'num') {
		throw new AiScriptRuntimeError(`Expect number, but got ${val.type}.`);
	}
}

export function assertObject(val: Value | null | undefined): asserts val is VObj {
	if (val == null) {
		throw new AiScriptRuntimeError('Expect object, but got nothing.');
	}
	if (val.type !== 'obj') {
		throw new AiScriptRuntimeError(`Expect object, but got ${val.type}.`);
	}
}

export function assertArray(val: Value | null | undefined): asserts val is VArr {
	if (val == null) {
		throw new AiScriptRuntimeError('Expect array, but got nothing.');
	}
	if (val.type !== 'arr') {
		throw new AiScriptRuntimeError(`Expect array, but got ${val.type}.`);
	}
}

export function isBoolean(val: Value): val is VBool {
	return val.type === 'bool';
}

export function isFunction(val: Value): val is VFn {
	return val.type === 'fn';
}

export function isString(val: Value): val is VStr {
	return val.type === 'str';
}

export function isNumber(val: Value): val is VNum {
	return val.type === 'num';
}

export function isObject(val: Value): val is VObj {
	return val.type === 'obj';
}

export function isArray(val: Value): val is VArr {
	return val.type === 'arr';
}

export function eq(a: Value, b: Value): boolean {
	if (a.type === 'fn' && b.type === 'fn') return a.native && b.native ? a.native === b.native : a === b;
	if (a.type === 'fn' || b.type === 'fn') return false;
	if (a.type === 'null' && b.type === 'null') return true;
	if (a.type === 'null' || b.type === 'null') return false;
	return (a.value === b.value);
}

export function valToString(val: Value, simple = false): string {
	if (simple) {
		if (val.type === 'num') return val.value.toString();
		if (val.type === 'bool') return val.value ? 'true' : 'false';
		if (val.type === 'str') return `"${val.value}"`;
		if (val.type === 'arr') return `[${val.value.map(item => valToString(item, true)).join(', ')}]`;
		if (val.type === 'null') return '(null)';
	}
	const label =
		val.type === 'num' ? val.value :
		val.type === 'bool' ? val.value :
		val.type === 'str' ? `"${val.value}"` :
		val.type === 'fn' ? '...' :
		val.type === 'obj' ? '...' :
		val.type === 'null' ? '' :
		null;

	return `${val.type}<${label}>`;
}

export type JsValue = { [key: string]: JsValue } | JsValue[] | string | number | boolean | null | undefined;

export function valToJs(val: Value): JsValue {
	switch (val.type) {
		case 'fn': return '<function>';
		case 'arr': return val.value.map(item => valToJs(item));
		case 'bool': return val.value;
		case 'null': return null;
		case 'num': return val.value;
		case 'obj': {
			const obj: { [key: string]: JsValue } = {};
			for (const [k, v] of val.value.entries()) {
				// TODO: keyが__proto__とかじゃないかチェック
				obj[k] = valToJs(v);
			}
			return obj;
		}
		case 'str': return val.value;
		default: throw new Error(`Unrecognized value type: ${val.type}`);
	}
}

export function jsToVal(val: unknown): Value {
	if (val === null) return NULL;
	if (typeof val === 'boolean') return BOOL(val);
	if (typeof val === 'string') return STR(val);
	if (typeof val === 'number') return NUM(val);
	if (Array.isArray(val)) return ARR(val.map(item => jsToVal(item)));
	if (typeof val === 'object') {
		const obj: VObj['value'] = new Map();
		for (const [k, v] of Object.entries(val)) {
			obj.set(k, jsToVal(v));
		}
		return OBJ(obj);
	}
	return NULL;
}

export function getLangVersion(input: string): string | null {
	const match = /^\s*\/\/\/\s*@\s*([A-Z0-9_.-]+)(?:[\r\n][\s\S]*)?$/i.exec(input);
	return (match != null) ? match[1]! : null;
}

/**
 * @param literalLike - `true` なら出力をリテラルに似せる
 */
export function reprValue(value: Value, literalLike = false, processedObjects = new Set<object>()): string {
	if ((value.type === 'arr' || value.type === 'obj') && processedObjects.has(value.value)) {
		return '...';
	}

	if (literalLike && value.type === 'str') return '"' + value.value.replace(/["\\\r\n]/g, x => `\\${x}`) + '"';
	if (value.type === 'str') return value.value;
	if (value.type === 'num') return value.value.toString();
	if (value.type === 'arr') {
		processedObjects.add(value.value);
		const content = [];

		for (const item of value.value) {
			content.push(reprValue(item, true, processedObjects));
		}

		return '[ ' + content.join(', ') + ' ]';
	}
	if (value.type === 'obj') {
		processedObjects.add(value.value);
		const content = [];

		for (const [key, val] of value.value) {
			content.push(`${key}: ${reprValue(val, true, processedObjects)}`);
		}

		return '{ ' + content.join(', ') + ' }';
	}
	if (value.type === 'bool') return value.value.toString();
	if (value.type === 'null') return 'null';
	if (value.type === 'fn') {
		if (value.native) {
			// そのうちネイティブ関数の引数も表示できるようにしたいが、ホスト向けの破壊的変更を伴うと思われる
			return '@( ?? ) { native code }';
		} else {
			return `@( ${(value.params.map(v => v.dest.type === 'identifier' ? v.dest.name : '?')).join(', ')} ) { ... }`;
		}
	}

	return '?';
}
