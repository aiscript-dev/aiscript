import { Value } from '..';
import { valToString } from '../util';

export const std: Record<string, Value> = {
	print: {
		type: 'function',
		native(args) {
			console.log('>>> ' + valToString(args[0]));
		}
	},
	set_interval: {
		type: 'function',
		native(args) {
		}
	},
};
