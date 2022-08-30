import { substring, length, indexOf, toArray } from 'stringz';
import { assertArray, assertBoolean, assertFunction, assertNumber, assertString, expectAny } from './util';
import { ARR, FALSE, FN_NATIVE, NULL, NUM, STR, TRUE, Value, VArr, VFn, VNum, VStr } from './value';

export const PRIMITIVE_PROPS = {
	num: {
		to_str: (target: VNum): VFn => FN_NATIVE(async ([], opts) => {
			return STR(target.value.toString());
		}),
	},

	str: {
		to_num: (target: VStr): VFn => FN_NATIVE(async ([], opts) => {
			const parsed = parseInt(target.value, 10);
			if (isNaN(parsed)) return NULL;
			return NUM(parsed);
		}),

		len: (target: VStr): VNum => NUM(length(target.value)),

		replace: (target: VStr): VFn => FN_NATIVE(async ([a, b], opts) => {
			assertString(a);
			assertString(b);
			return STR(target.value.split(a.value).join(b.value));
		}),

		index_of: (target: VStr): VFn => FN_NATIVE(async ([search], opts) => {
			assertString(search);
			return NUM(indexOf(target.value, search.value));
		}),

		incl: (target: VStr): VFn => FN_NATIVE(async ([search], opts) => {
			assertString(search);
			return target.value.includes(search.value) ? TRUE : FALSE;
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

		split: (target: VStr): VFn => FN_NATIVE(async ([splitter], opts) => {
			if (splitter) assertString(splitter);
			if (splitter) {
				return ARR(target.value.split(splitter ? splitter.value : '').map(s => STR(s)));
			} else {
				return ARR(toArray(target.value).map(s => STR(s)));
			}
		}),

		slice: (target: VStr): VFn => FN_NATIVE(async ([begin, end], opts) => {
			assertNumber(begin);
			assertNumber(end);
			return STR(substring(target.value, begin.value, end.value));
		}),

		pick: (target: VStr): VFn => FN_NATIVE(async ([i], opts) => {
			assertNumber(i);
			const chars = toArray(target.value);
			const char = chars[i.value];
			return char ? STR(char) : NULL;
		}),
	},

	arr: {
		len: (target: VArr): VNum => NUM(target.value.length),

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

		slice: (target: VArr): VFn => FN_NATIVE(async ([begin, end], opts) => {
			assertNumber(begin);
			assertNumber(end);
			return ARR(target.value.slice(begin.value, end.value));
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

		reduce: (target: VArr): VFn => FN_NATIVE(async ([fn, initialValue], opts) => {
			assertFunction(fn);
			const withInitialValue = initialValue != null;
			let accumulator = withInitialValue ? initialValue : target.value[0];
			for (let i = withInitialValue ? 0 : 1; i < target.value.length; i++) {
				const item = target.value[i];
				accumulator = await opts.call(fn, [accumulator, item, NUM(i + 1)]);
			}
			return accumulator;
		}),

		find: (target: VArr): VFn => FN_NATIVE(async ([fn], opts) => {
			assertFunction(fn);
			for (let i = 0; i < target.value.length; i++) {
				const item = target.value[i];
				const res = await opts.call(fn, [item, NUM(i + 1)]);
				assertBoolean(res);
				if (res.value) return item;
			}
			return NULL;
		}),

		incl: (target: VArr): VFn => FN_NATIVE(async ([val], opts) => {
			expectAny(val);
			if (val.type !== 'str' && val.type !== 'num' && val.type !== 'bool' && val.type !== 'null') return FALSE;
			const getValue = (v: VArr) => {
				return v.value.map(i => {
					if (i.type === 'str') return i.value;
					if (i.type === 'num') return i.value;
					if (i.type === 'bool') return i.value;
					if (i.type === 'null') return null;
					return Symbol();
				});
			};
			return getValue(target).includes(val.type === 'null' ? null : val.value) ? TRUE : FALSE;
		}),
	},
} as const;
