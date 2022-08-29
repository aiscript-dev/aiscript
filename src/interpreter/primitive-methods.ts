import { substring, length, indexOf, toArray } from 'stringz';
import { assertArray, assertBoolean, assertFunction, assertString, expectAny } from './util';
import { ARR, FN_NATIVE, NULL, NUM, STR, Value, VArr, VFn, VStr } from './value';

export const PRIMITIVE_METHODS = {
	str: {
		to_num: (target: VStr): VFn => FN_NATIVE(async ([], opts) => {
			const parsed = parseInt(target.value, 10);
			if (isNaN(parsed)) return NULL;
			return NUM(parsed);
		}),
		len: (target: VStr): VFn => FN_NATIVE(async ([], opts) => {
			return NUM(length(target.value));
		}),
		replace: (target: VStr): VFn => FN_NATIVE(async ([a, b], opts) => {
			assertString(a);
			assertString(b);
			return STR(target.value.split(a.value).join(b.value));
		}),
		index_of: (target: VStr): VFn => FN_NATIVE(async ([search], opts) => {
			assertString(search);
			return NUM(indexOf(target.value, search.value) + 1);
		}),
		trim: (target: VStr): VFn => FN_NATIVE(async ([], opts) => {
			return STR(target.value.trim());
		}),
		upper: (target: VStr): VFn => FN_NATIVE(async ([], opts) => {
			return STR(target.value.toUpperCase());
		}),
		lower: (target: VStr): VFn => FN_NATIVE(async ([], opts) => {
			return STR(target.value.toLowerCase());
		}),
	},
	arr: {
		len: (target: VArr): VFn => FN_NATIVE(async ([], opts) => {
			return NUM(target.value.length);
		}),
		push: (target: VArr): VFn => FN_NATIVE(async ([val], opts) => {
			expectAny(val);
			target.value.push(val);
			return target;
		}),
		unshift: (target: VArr): VFn => FN_NATIVE(async ([val], opts) => {
			expectAny(val);
			target.value.unshift(val);
			return target;
		}),
		pop: (target: VArr): VFn => FN_NATIVE(async ([], opts) => {
			return target.value.pop() ?? NULL;
		}),
		shift: (target: VArr): VFn => FN_NATIVE(async ([], opts) => {
			return target.value.shift() ?? NULL;
		}),
		concat: (target: VArr): VFn => FN_NATIVE(async ([x], opts) => {
			assertArray(x);
			return ARR(target.value.concat(x.value));
		}),
		join: (target: VArr): VFn => FN_NATIVE(async ([joiner], opts) => {
			if (joiner) assertString(joiner);
			return STR(target.value.map(i => i.type === 'str' ? i.value : '').join(joiner ? joiner.value : ''));
		}),
		map: (target: VArr): VFn => FN_NATIVE(async ([fn], opts) => {
			assertFunction(fn);
			const vals = target.value.map(async (item, i) => {
				return await opts.call(fn, [item, NUM(i + 1)]);
			});
			return ARR(await Promise.all(vals));
		}),
		filter: (target: VArr): VFn => FN_NATIVE(async ([fn], opts) => {
			assertFunction(fn);
			const vals = [] as Value[];
			for (let i = 0; i < target.value.length; i++) {
				const item = target.value[i];
				const res = await opts.call(fn, [item, NUM(i + 1)]);
				assertBoolean(res);
				if (res.value) vals.push(item);
			}
			return ARR(vals);
		}),
	},
} as const;
