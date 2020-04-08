import { Value, FALSE } from '..';
import { assertNumber } from '../util';

export const core: Record<string, Value> = {
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
