import { Value } from '.';
import { valToString } from './util';

export const std: Record<string, Value> = {
	print: {
		type: 'function',
		native(args) {
			console.log('>>> ' + valToString(args[0]));
		}
	},
	eq: {
		type: 'function',
		native(args) {
			return {
				type: 'boolean',
				value: args[0].value === args[1].value
			};
		}
	},
	add: {
		type: 'function',
		native(args) {
			return {
				type: 'number',
				value: args[0].value + args[1].value
			};
		}
	},
	gt: {
		type: 'function',
		native(args) {
			return {
				type: 'boolean',
				value: args[0].value > args[1].value
			};
		}
	},
	lt: {
		type: 'function',
		native(args) {
			return {
				type: 'boolean',
				value: args[0].value < args[1].value
			};
		}
	},
};
