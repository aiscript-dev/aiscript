import { Scope } from './scope';
import { Node } from './node';

export type VNull = {
	type: 'null';
	value: null;
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
	value: Record<string, Value>;
};

export type VFn = {
	type: 'fn';
	args?: string[];
	statements?: Node[];
	native?: (args: Value[]) => Value | Promise<Value> | void;
	scope?: Scope;
};

export type VReturn = {
	type: 'return';
	value: Value;
};

export type Value = VNull | VBool | VNum | VStr | VArr | VObj | VFn | VReturn;

export const NULL = {
	type: 'null' as const,
	value: null
};

export const TRUE = {
	type: 'bool' as const,
	value: true
};

export const FALSE = {
	type: 'bool' as const,
	value: false
};

export const NUM = (num: number) => ({
	type: 'num' as const,
	value: num
});

export const STR = (str: string) => ({
	type: 'str' as const,
	value: str
});

export const BOOL = (bool: boolean) => ({
	type: 'bool' as const,
	value: bool
});

export const FN_NATIVE = (fn: VFn['native']) => ({
	type: 'fn' as const,
	native: fn
});

export const RETURN = (v: Value) => ({
	type: 'return' as const,
	value: v
});

export const unWrapRet = (v: Value) => v.type === 'return' ? v.value : v;
