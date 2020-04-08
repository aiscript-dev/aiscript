import { Value, FALSE } from '..';
import { assertNumber, assertBoolean } from '../util';

export const core: Record<string, Value> = {
	not: {
		type: 'function',
		native(args) {
			const a = args[0];
			assertBoolean(a);
			return {
				type: 'boolean',
				value: !a.value
			};
		}
	},
	eq: {
		type: 'function',
		native(args) {
			const a = args[0];
			const b = args[1];
			if (a.type === 'function') return FALSE;
			if (b.type === 'function') return FALSE;
			return {
				type: 'boolean',
				value: a.value === b.value
			};
		}
	},
	and: {
		type: 'function',
		native(args) {
			const a = args[0];
			const b = args[1];
			assertBoolean(a);
			assertBoolean(b);
			return {
				type: 'boolean',
				value: a.value && b.value
			};
		}
	},
	or: {
		type: 'function',
		native(args) {
			const a = args[0];
			const b = args[1];
			assertBoolean(a);
			assertBoolean(b);
			return {
				type: 'boolean',
				value: a.value || b.value
			};
		}
	},
	add: {
		type: 'function',
		native(args) {
			const a = args[0];
			const b = args[1];
			assertNumber(a);
			assertNumber(b);
			return {
				type: 'number',
				value: a.value + b.value
			};
		}
	},
	sub: {
		type: 'function',
		native(args) {
			const a = args[0];
			const b = args[1];
			assertNumber(a);
			assertNumber(b);
			return {
				type: 'number',
				value: a.value - b.value
			};
		}
	},
	mul: {
		type: 'function',
		native(args) {
			const a = args[0];
			const b = args[1];
			assertNumber(a);
			assertNumber(b);
			return {
				type: 'number',
				value: a.value * b.value
			};
		}
	},
	div: {
		type: 'function',
		native(args) {
			const a = args[0];
			const b = args[1];
			assertNumber(a);
			assertNumber(b);
			return {
				type: 'number',
				value: a.value / b.value
			};
		}
	},
	mod: {
		type: 'function',
		native(args) {
			const a = args[0];
			const b = args[1];
			assertNumber(a);
			assertNumber(b);
			return {
				type: 'number',
				value: a.value % b.value
			};
		}
	},
	gt: {
		type: 'function',
		native(args) {
			const a = args[0];
			const b = args[1];
			assertNumber(a);
			assertNumber(b);
			return {
				type: 'boolean',
				value: a.value > b.value
			};
		}
	},
	lt: {
		type: 'function',
		native(args) {
			const a = args[0];
			const b = args[1];
			assertNumber(a);
			assertNumber(b);
			return {
				type: 'boolean',
				value: a.value < b.value
			};
		}
	},
};
