import { Value, FALSE, TRUE, NUM, FN_NATIVE, STR, NULL } from '../value';
import { assertNumber, assertBoolean } from '../util';
import { AiScriptError } from '../error';

export const core: Record<string, Value> = {
	ai: STR('kawaii'),
	not: FN_NATIVE(([a]) => {
		assertBoolean(a);
		return a.value ? FALSE : TRUE;
	}),
	eq: FN_NATIVE(([a, b]) => {
		if (a.type === 'fn' || b.type === 'fn') return FALSE;
		if (a.type === 'null' && b.type === 'null') return TRUE;
		if (a.type === 'null' || b.type === 'null') return FALSE;
		return (a.value === b.value) ? TRUE : FALSE;
	}),
	and: FN_NATIVE(([a, b]) => {
		assertBoolean(a);
		assertBoolean(b);
		return (a.value && b.value) ? TRUE : FALSE;
	}),
	or: FN_NATIVE(([a, b]) => {
		assertBoolean(a);
		assertBoolean(b);
		return (a.value || b.value) ? TRUE : FALSE;
	}),
	add: FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		return NUM(a.value + b.value);
	}),
	sub: FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		return NUM(a.value - b.value);
	}),
	mul: FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		return NUM(a.value * b.value);
	}),
	div: FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		const res = a.value / b.value;
		if (isNaN(res)) throw new AiScriptError('Invalid operation.');
		return NUM(res);
	}),
	mod: FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		return NUM(a.value % b.value);
	}),
	gt: FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		return a.value > b.value ? TRUE : FALSE;
	}),
	lt: FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		return a.value < b.value ? TRUE : FALSE;
	}),
	type: FN_NATIVE(([a]) => {
		return STR(a.type);
	}),
	len: FN_NATIVE(([a]) => {
		if (a.type !== 'arr' && a.type !== 'str') return NUM(0);
		return NUM(a.value.length);
	}),
	to_str: FN_NATIVE(([a]) => {
		if (a.type === 'str') return a;
		if (a.type === 'num') return STR(a.value.toString());
		return STR('?');
	}),
	to_num: FN_NATIVE(([a]) => {
		if (a.type === 'num') return a;
		if (a.type === 'str') {
			const parsed = parseInt(a.value, 10);
			if (isNaN(parsed)) return NULL;
			return NUM(parsed);
		}
		return NULL;
	}),
};
