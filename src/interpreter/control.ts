import { AiScriptRuntimeError } from '../error.js';
import type { Reference } from './reference.js';
import type { Value } from './value.js';

export type CReturn = {
	type: 'return';
	value: Value;
};

export type CBreak = {
	type: 'break';
	value: null;
};

export type CContinue = {
	type: 'continue';
	value: null;
};

export type Control = CReturn | CBreak | CContinue;

// Return文で値が返されたことを示すためのラッパー
export const RETURN = (v: CReturn['value']): CReturn => ({
	type: 'return' as const,
	value: v,
});

export const BREAK = (): CBreak => ({
	type: 'break' as const,
	value: null,
});

export const CONTINUE = (): CContinue => ({
	type: 'continue' as const,
	value: null,
});

export function unWrapRet(v: Value | Control): Value {
	switch (v.type) {
		case 'return':
			return v.value;
		default: {
			assertValue(v);
			return v;
		}
	}
}

export function assertValue(v: Value | Control): asserts v is Value {
	switch (v.type) {
		case 'return':
			throw new AiScriptRuntimeError('Invalid return');
		case 'break':
			throw new AiScriptRuntimeError('Invalid break');
		case 'continue':
			throw new AiScriptRuntimeError('Invalid continue');
		default:
			v satisfies Value;
	}
}

export function isValue(v: Value | Control): v is Value {
	switch (v.type) {
		case 'null':
		case 'bool':
		case 'num':
		case 'str':
		case 'arr':
		case 'obj':
		case 'fn':
		case 'error':
			return true;
		case 'return':
		case 'break':
		case 'continue':
			return false;
	}
	// exhaustive check
	v satisfies never;
	throw new TypeError('expected value or control');
}

export function isControl(v: Value | Control | Reference): v is Control {
	switch (v.type) {
		case 'null':
		case 'bool':
		case 'num':
		case 'str':
		case 'arr':
		case 'obj':
		case 'fn':
		case 'error':
		case 'reference':
			return false;
		case 'return':
		case 'break':
		case 'continue':
			return true;
	}
	// exhaustive check
	v satisfies never;
	throw new TypeError('expected value or control');
}
