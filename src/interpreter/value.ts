import { AiScriptRuntimeError } from '../error.js';
import type { Expression, Node } from '../node.js';
import type { Type } from '../type.js';
import type { Scope } from './scope.js';

export type VNull = {
	type: 'null';
};

export type VBool = {
	type: 'bool';
	value: boolean;
};

export type VNum = {
	type: 'num';
	value: number;
};

export type VStr = {
	type: 'str';
	value: string;
};

export type VArr = {
	type: 'arr';
	value: Value[];
};

export type VObj = {
	type: 'obj';
	value: Map<string, Value>;
};

export type VFn = VUserFn | VNativeFn;
type VFnBase = {
	type: 'fn';
};
export type VUserFn = VFnBase & {
	native?: undefined; // if (vfn.native) で型アサーション出来るように
	name?: string;
	params: VFnParam[];
	statements: Node[];
	scope: Scope;
};
export type VFnParam = {
	dest: Expression;
	type?: Type;
	default?: Value;
}
/**
 * When your AiScript NATIVE function passes VFn.call to other caller(s) whose error thrown outside the scope, use VFn.topCall instead to keep it under AiScript error control system.
 */
export type VNativeFn = VFnBase & {
	native: (args: (Value | undefined)[], opts: {
		call: (fn: VFn, args: Value[]) => Promise<Value>;
		topCall: (fn: VFn, args: Value[]) => Promise<Value>;
		registerAbortHandler: (handler: () => void) => void;
		unregisterAbortHandler: (handler: () => void) => void;
	}) => Value | Promise<Value> | void;
};

export type VReturn = {
	type: 'return';
	value: Value;
};

export type VBreak = {
	type: 'break';
	value: null;
};

export type VContinue = {
	type: 'continue';
	value: null;
};

export type VError = {
	type: 'error';
	value: string;
	info?: Value;
};

export type Attr = {
	attr?: {
		name: string;
		value: Value;
	}[];
};

export type Value = (VNull | VBool | VNum | VStr | VArr | VObj | VFn | VError) & Attr;

export type Control = VReturn | VBreak | VContinue;

export const NULL = {
	type: 'null' as const,
};

export const TRUE = {
	type: 'bool' as const,
	value: true,
};

export const FALSE = {
	type: 'bool' as const,
	value: false,
};

export const NUM = (num: VNum['value']): VNum => ({
	type: 'num' as const,
	value: num,
});

export const STR = (str: VStr['value']): VStr => ({
	type: 'str' as const,
	value: str,
});

export const BOOL = (bool: VBool['value']): VBool => ({
	type: 'bool' as const,
	value: bool,
});

export const OBJ = (obj: VObj['value']): VObj => ({
	type: 'obj' as const,
	value: obj,
});

export const ARR = (arr: VArr['value']): VArr => ({
	type: 'arr' as const,
	value: arr,
});

export const FN = (params: VUserFn['params'], statements: VUserFn['statements'], scope: VUserFn['scope']): VUserFn => ({
	type: 'fn' as const,
	params: params,
	statements: statements,
	scope: scope,
});

export const FN_NATIVE = (fn: VNativeFn['native']): VNativeFn => ({
	type: 'fn' as const,
	native: fn,
});

// Return文で値が返されたことを示すためのラッパー
export const RETURN = (v: VReturn['value']): VReturn => ({
	type: 'return' as const,
	value: v,
});

export const BREAK = (): VBreak => ({
	type: 'break' as const,
	value: null,
});

export const CONTINUE = (): VContinue => ({
	type: 'continue' as const,
	value: null,
});

export const ERROR = (name: string, info?: Value): Value => ({
	type: 'error' as const,
	value: name,
	info: info,
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

export function isControl(v: Value | Control): v is Control {
	switch (v.type) {
		case 'null':
		case 'bool':
		case 'num':
		case 'str':
		case 'arr':
		case 'obj':
		case 'fn':
		case 'error':
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
