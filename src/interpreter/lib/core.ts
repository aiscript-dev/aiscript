import { Value } from '../..';
import { Scope } from '../scope';

export const core: Record<string, Value> = {
	eq: {
		type: 'function',
		native(args) {
			return {
				type: 'boolean',
				value: args[0].value === args[1].value
			};
		},
		scope: new Scope()
	},
	add: {
		type: 'function',
		native(args) {
			return {
				type: 'number',
				value: args[0].value + args[1].value
			};
		},
		scope: new Scope()
	},
	gt: {
		type: 'function',
		native(args) {
			return {
				type: 'boolean',
				value: args[0].value > args[1].value
			};
		},
		scope: new Scope()
	},
	lt: {
		type: 'function',
		native(args) {
			return {
				type: 'boolean',
				value: args[0].value < args[1].value
			};
		},
		scope: new Scope()
	},
};
