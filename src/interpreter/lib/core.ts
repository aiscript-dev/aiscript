import { Value, FALSE, TRUE, NUM, FN_NATIVE } from '../value';
import { assertNumber, assertBoolean } from '../util';

export const core: Record<string, Value> = {
	ai: {
		type: 'str',
		value: 'kawaii'
	},
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
		return NUM(a.value / b.value);
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
};
