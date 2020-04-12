import { Value, NUM, STR, FN_NATIVE } from '../value';
import { assertNumber } from '../util';

export const std: Record<string, Value> = {
	'Math:PI': NUM(Math.PI),
	'Math:sin': FN_NATIVE(([a]) => {
		assertNumber(a);
		return NUM(Math.sin(a.value));
	}),
	'Math:cos': FN_NATIVE(([a]) => {
		assertNumber(a);
		return NUM(Math.cos(a.value));
	}),
	'Math:abs': FN_NATIVE(([a]) => {
		assertNumber(a);
		return NUM(Math.abs(a.value));
	}),
	'Math:sqrt': FN_NATIVE(([a]) => {
		assertNumber(a);
		return NUM(Math.sqrt(a.value));
	}),
	'Math:round': FN_NATIVE(([a]) => {
		assertNumber(a);
		return NUM(Math.round(a.value));
	}),
	'Math:floor': FN_NATIVE(([a]) => {
		assertNumber(a);
		return NUM(Math.floor(a.value));
	}),
	'Math:min': FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		return NUM(Math.min(a.value, b.value));
	}),
	'Math:max': FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		return NUM(Math.max(a.value, b.value));
	}),
	'Math:rnd': FN_NATIVE(([a, b]) => {
		if (a && a.type === 'num' && b && b.type === 'num') {
			const min = a.value;
			const max = b.value;
			return NUM(Math.floor(Math.random() * (max - min + 1) + min));
		}
		return NUM(Math.random());
	}),
};
