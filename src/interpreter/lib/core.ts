import { Value, FALSE, TRUE, NUM } from '..';
import { assertNumber, assertBoolean } from '../util';

export const core: Record<string, Value> = {
	not: {
		type: 'fn',
		native([a]) {
			assertBoolean(a);
			return a.value ? FALSE : TRUE;
		}
	},
	eq: {
		type: 'fn',
		native([a, b]) {
			if (a.type === 'fn') return FALSE;
			if (b.type === 'fn') return FALSE;
			return (a.value === b.value) ? TRUE : FALSE;
		}
	},
	and: {
		type: 'fn',
		native([a, b]) {
			assertBoolean(a);
			assertBoolean(b);
			return (a.value && b.value) ? TRUE : FALSE;
		}
	},
	or: {
		type: 'fn',
		native([a, b]) {
			assertBoolean(a);
			assertBoolean(b);
			return (a.value || b.value) ? TRUE : FALSE;
		}
	},
	add: {
		type: 'fn',
		native([a, b]) {
			assertNumber(a);
			assertNumber(b);
			return NUM(a.value + b.value);
		}
	},
	sub: {
		type: 'fn',
		native([a, b]) {
			assertNumber(a);
			assertNumber(b);
			return NUM(a.value - b.value);
		}
	},
	mul: {
		type: 'fn',
		native([a, b]) {
			assertNumber(a);
			assertNumber(b);
			return NUM(a.value * b.value);
		}
	},
	div: {
		type: 'fn',
		native([a, b]) {
			assertNumber(a);
			assertNumber(b);
			return NUM(a.value / b.value);
		}
	},
	mod: {
		type: 'fn',
		native([a, b]) {
			assertNumber(a);
			assertNumber(b);
			return NUM(a.value % b.value);
		}
	},
	gt: {
		type: 'fn',
		native([a, b]) {
			assertNumber(a);
			assertNumber(b);
			return a.value > b.value ? TRUE : FALSE;
		}
	},
	lt: {
		type: 'fn',
		native([a, b]) {
			assertNumber(a);
			assertNumber(b);
			return a.value < b.value ? TRUE : FALSE;
		}
	},
};
