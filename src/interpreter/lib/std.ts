import { Value, NUM, STR, FN_NATIVE } from '../value';

export const std: Record<string, Value> = {
	type: FN_NATIVE(([a]) => {
		return STR(a.type);
	}),
	len: FN_NATIVE(([a]) => {
		if (a.type !== 'arr' && a.type !== 'str') return NUM(0);
		return NUM(a.value.length);
	}),
};
