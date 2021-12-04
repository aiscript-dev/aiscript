import { Value, VStr, VNum, VBool, VFn, VObj, VArr, STR, NUM, ARR, OBJ, NULL, BOOL } from './value';
import { Node } from '../node';
import { AiScriptError } from './error';

export function assertBoolean(val: Value): asserts val is VBool {
	if (val.type !== 'bool') {
		throw new AiScriptError(`Expect boolean, but got ${val.type}.`);
	}
}

export function assertFunction(val: Value): asserts val is VFn {
	if (val.type !== 'fn') {
		throw new AiScriptError(`Expect function, but got ${val.type}.`);
	}
}

export function assertString(val: Value): asserts val is VStr {
	if (val.type !== 'str') {
		throw new AiScriptError(`Expect string, but got ${val.type}.`);
	}
}

export function assertNumber(val: Value): asserts val is VNum {
	if (val.type !== 'num') {
		throw new AiScriptError(`Expect number, but got ${val.type}.`);
	}
}

export function assertObject(val: Value): asserts val is VObj {
	if (val.type !== 'obj') {
		throw new AiScriptError(`Expect object, but got ${val.type}.`);
	}
}

export function assertArray(val: Value): asserts val is VArr {
	if (val.type !== 'arr') {
		throw new AiScriptError(`Expect array, but got ${val.type}.`);
	}
}

export function eq(a: Value, b: Value) {
	if (a.type === 'fn' || b.type === 'fn') return false;
	if (a.type === 'null' && b.type === 'null') return true;
	if (a.type === 'null' || b.type === 'null') return false;
	return (a.value === b.value);
}

export function valToString(val: Value, simple = false) {
	if (simple) {
		if (val.type === 'num') return val.value;
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

export function nodeToString(node: Node) {
	const label =
		node.type === 'num' ? node.value :
		node.type === 'bool' ? node.value :
		node.type === 'str' ? node.value :
		node.type === 'fn' ? null :
		node.type === 'null' ? null :
		node.type === 'def' ? node.name :
		node.type === 'var' ? node.name :
		node.type === 'call' ? node.name :
		null;
	return label ? `${node.type.toUpperCase()} (${label})` : node.type.toUpperCase();
}

export function valToJs(val: Value): any {
	switch (val.type) {
		case 'arr': return val.value.map(item => valToJs(item));
		case 'bool': return val.value;
		case 'null': return null;
		case 'num': return val.value;
		case 'obj': {
			const obj = {};
			for (const [k, v] of val.value.entries()) {
				// TODO: keyが__proto__とかじゃないかチェック
				obj[k] = valToJs(v);
			}
			return obj;
		}
		case 'str': return val.value;
		default: return undefined;
	}
}

export function jsToVal(val: any): Value {
	if (val === null) return NULL;
	if (typeof val === 'boolean') return BOOL(val);
	if (typeof val === 'string') return STR(val);
	if (typeof val === 'number') return NUM(val);
	if (Array.isArray(val)) return ARR(val.map(item => jsToVal(item)));
	if (typeof val === 'object') {
		const obj = new Map();
		for (const [k, v] of Object.entries(val)) {
			obj.set(k, jsToVal(v));
		}
		return OBJ(obj);
	}
	return NULL;
}

export function getLangVersion(input: string): string | null {
	const match = /^\/\/\s?@\s?([A-Z0-9_.-]+)(?:[\r\n][\s\S]*)?$/i.exec(input);
	return (match != null) ? match[1] : null;
}
