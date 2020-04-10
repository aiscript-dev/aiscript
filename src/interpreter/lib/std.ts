import { Value, NUM, STR } from '../value';

export const std: Record<string, Value> = {
	type: {
		type: 'fn',
		native([a]) {
			return STR(a.type);
		}
	},
	len: {
		type: 'fn',
		native([a]) {
			if (a.type !== 'arr' && a.type !== 'str') return NUM(0);
			return NUM(a.value.length);
		}
	},
};
