import { Value } from '../..';
import { valToString } from '../util';
import { Scope } from '../scope';

export const std: Record<string, Value> = {
	print: {
		type: 'function',
		native(args) {
			console.log('>>> ' + valToString(args[0]));
		},
		scope: new Scope()
	},
	set_interval: {
		type: 'function',
		native(args) {
		},
		scope: new Scope()
	},
};
