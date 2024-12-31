// JavaScriptは一部のUnicode文字列を正しく扱えないため標準関数の代わりにstringzの関数を使う
import { substring, length, indexOf, toArray } from 'stringz';
import { AiScriptRuntimeError } from '../error.js';
import { textEncoder } from '../const.js';
import { assertArray, assertBoolean, assertFunction, assertNumber, assertString, expectAny, eq, isArray } from './util.js';
import { ARR, FALSE, FN_NATIVE, NULL, NUM, STR, TRUE } from './value.js';
import type { Value, VArr, VFn, VNum, VStr, VError } from './value.js';

type VWithPP = VNum|VStr|VArr|VError;

const PRIMITIVE_PROPS: {
	[key in VWithPP['type']]: Map<string, (target: Value) => Value>;
} & {
	[key in (Exclude<Value, VWithPP>)['type']]?: never;
} = {
	num: new Map(Object.entries({
		to_str: (target: VNum): VFn => FN_NATIVE(async (_, _opts) => {
			return STR(target.value.toString());
		}),

		to_hex: (target: VNum): VFn => FN_NATIVE(async (_, _opts) => {
			return STR(target.value.toString(16));
		}),
	})),

	str: new Map(Object.entries({
		to_num: (target: VStr): VFn => FN_NATIVE(async (_, _opts) => {
			const parsed = parseInt(target.value, 10);
			if (isNaN(parsed)) return NULL;
			return NUM(parsed);
		}),

		to_arr: (target: VStr): VFn => FN_NATIVE(async (_, _opts) => {
			return ARR(toArray(target.value).map(s => STR(s)));
		}),

		to_unicode_arr: (target: VStr): VFn => FN_NATIVE(async (_, _opts) => {
			return ARR([...target.value].map((s) => STR(s)));
		}),

		to_unicode_codepoint_arr: (target: VStr): VFn => FN_NATIVE(async (_, _opts) => {
			return ARR([...target.value].map((s) => {
				const res = s.codePointAt(0);
				return NUM(res ?? s.charCodeAt(0));
			}));
		}),

		to_char_arr: (target: VStr): VFn => FN_NATIVE(async (_, _opts) => {
			return ARR(target.value.split('').map((s) => STR(s)));
		}),

		to_charcode_arr: (target: VStr): VFn => FN_NATIVE(async (_, _opts) => {
			return ARR(target.value.split('').map((s) => NUM(s.charCodeAt(0))));
		}),

		to_utf8_byte_arr: (target: VStr): VFn => FN_NATIVE(async (_, _opts) => {
			return ARR(Array.from(textEncoder.encode(target.value)).map((s) => NUM(s)));
		}),

		len: (target: VStr): VNum => NUM(length(target.value)),

		replace: (target: VStr): VFn => FN_NATIVE(async ([a, b], _opts) => {
			assertString(a);
			assertString(b);
			return STR(target.value.split(a.value).join(b.value));
		}),

		index_of: (target: VStr): VFn => FN_NATIVE(async ([search, fromI], _opts) => {
			assertString(search);
			if (fromI) assertNumber(fromI);
			const pos = fromI ? (fromI.value < 0 ? target.value.length + fromI.value : fromI.value) : undefined;
			return NUM(indexOf(target.value, search.value, pos));
		}),

		incl: (target: VStr): VFn => FN_NATIVE(async ([search], _opts) => {
			assertString(search);
			return target.value.includes(search.value) ? TRUE : FALSE;
		}),

		trim: (target: VStr): VFn => FN_NATIVE(async (_, _opts) => {
			return STR(target.value.trim());
		}),

		upper: (target: VStr): VFn => FN_NATIVE(async (_, _opts) => {
			return STR(target.value.toUpperCase());
		}),

		lower: (target: VStr): VFn => FN_NATIVE(async (_, _opts) => {
			return STR(target.value.toLowerCase());
		}),

		split: (target: VStr): VFn => FN_NATIVE(async ([splitter], _opts) => {
			if (splitter) assertString(splitter);
			if (splitter) {
				return ARR(target.value.split(splitter ? splitter.value : '').map(s => STR(s)));
			} else {
				return ARR(toArray(target.value).map(s => STR(s)));
			}
		}),

		slice: (target: VStr): VFn => FN_NATIVE(async ([begin, end], _opts) => {
			assertNumber(begin);
			assertNumber(end);
			return STR(substring(target.value, begin.value, end.value));
		}),

		pick: (target: VStr): VFn => FN_NATIVE(async ([i], _opts) => {
			assertNumber(i);
			const chars = toArray(target.value);
			const char = chars[i.value];
			return char ? STR(char) : NULL;
		}),

		charcode_at: (target: VStr): VFn => FN_NATIVE(([i], _) => {
			assertNumber(i);

			const res = target.value.charCodeAt(i.value);

			return Number.isNaN(res) ? NULL : NUM(res);
		}),

		codepoint_at: (target: VStr): VFn => FN_NATIVE(([i], _) => {
			assertNumber(i);

			const res = target.value.codePointAt(i.value) ?? target.value.charCodeAt(i.value);
			return Number.isNaN(res) ? NULL : NUM(res);
		}),

		starts_with: (target: VStr): VFn => FN_NATIVE(async ([prefix, start_index], _opts) => {
			assertString(prefix);
			if (!prefix.value) {
				return TRUE;
			}

			if (start_index) assertNumber(start_index);
			const raw_index = start_index?.value ?? 0;
			if (raw_index < -target.value.length || raw_index > target.value.length) {
				return FALSE;
			}
			const index = (raw_index >= 0) ? raw_index : target.value.length + raw_index;
			return target.value.startsWith(prefix.value, index) ? TRUE : FALSE;
		}),

		ends_with: (target: VStr): VFn => FN_NATIVE(async ([suffix, end_index], _opts) => {
			assertString(suffix);
			if (!suffix.value) {
				return TRUE;
			}

			if (end_index) assertNumber(end_index);
			const raw_index = end_index?.value ?? target.value.length;
			if (raw_index < -target.value.length || raw_index > target.value.length) {
				return FALSE;
			}
			const index = (raw_index >= 0) ? raw_index : target.value.length + raw_index;

			return target.value.endsWith(suffix.value, index) ? TRUE : FALSE;
		}),

		pad_start: (target: VStr): VFn => FN_NATIVE(([width, pad], _) => {
			assertNumber(width);
			const s = (pad) ? (assertString(pad), pad.value) : ' ';

			return STR(target.value.padStart(width.value, s));
		}),

		pad_end: (target: VStr): VFn => FN_NATIVE(([width, pad], _) => {
			assertNumber(width);
			const s = (pad) ? (assertString(pad), pad.value) : ' ';

			return STR(target.value.padEnd(width.value, s));
		}),
	})),

	arr: new Map(Object.entries({
		len: (target: VArr): VNum => NUM(target.value.length),

		push: (target: VArr): VFn => FN_NATIVE(async ([val], _opts) => {
			expectAny(val);
			target.value.push(val);
			return target;
		}),

		unshift: (target: VArr): VFn => FN_NATIVE(async ([val], _opts) => {
			expectAny(val);
			target.value.unshift(val);
			return target;
		}),

		pop: (target: VArr): VFn => FN_NATIVE(async (_, _opts) => {
			return target.value.pop() ?? NULL;
		}),

		shift: (target: VArr): VFn => FN_NATIVE(async (_, _opts) => {
			return target.value.shift() ?? NULL;
		}),

		concat: (target: VArr): VFn => FN_NATIVE(async ([x], _opts) => {
			assertArray(x);
			return ARR(target.value.concat(x.value));
		}),

		slice: (target: VArr): VFn => FN_NATIVE(async ([begin, end], _opts) => {
			assertNumber(begin);
			assertNumber(end);
			return ARR(target.value.slice(begin.value, end.value));
		}),

		join: (target: VArr): VFn => FN_NATIVE(async ([joiner], _opts) => {
			if (joiner) assertString(joiner);
			return STR(target.value.map(i => i.type === 'str' ? i.value : '').join(joiner ? joiner.value : ''));
		}),

		map: (target: VArr): VFn => FN_NATIVE(async ([fn], opts) => {
			assertFunction(fn);
			const vals = target.value.map(async (item, i) => {
				return await opts.call(fn, [item, NUM(i)]);
			});
			return ARR(await Promise.all(vals));
		}),

		filter: (target: VArr): VFn => FN_NATIVE(async ([fn], opts) => {
			assertFunction(fn);
			const vals: Value[] = [];
			for (const [i, item] of target.value.entries()) {
				const res = await opts.call(fn, [item, NUM(i)]);
				assertBoolean(res);
				if (res.value) vals.push(item);
			}
			return ARR(vals);
		}),

		reduce: (target: VArr): VFn => FN_NATIVE(async ([fn, initialValue], opts) => {
			assertFunction(fn);
			const withInitialValue = initialValue != null;
			if (!withInitialValue && (target.value.length === 0)) throw new AiScriptRuntimeError('Reduce of empty array without initial value');
			let accumulator = withInitialValue ? initialValue : target.value[0]!;
			for (let i = withInitialValue ? 0 : 1; i < target.value.length; i++) {
				const item = target.value[i]!;
				accumulator = await opts.call(fn, [accumulator, item, NUM(i)]);
			}
			return accumulator;
		}),

		find: (target: VArr): VFn => FN_NATIVE(async ([fn], opts) => {
			assertFunction(fn);
			for (const [i, item] of target.value.entries()) {
				const res = await opts.call(fn, [item, NUM(i)]);
				assertBoolean(res);
				if (res.value) return item;
			}
			return NULL;
		}),

		incl: (target: VArr): VFn => FN_NATIVE(async ([val], _opts) => {
			expectAny(val);
			return target.value.some(item => eq(val, item)) ? TRUE : FALSE;
		}),

		index_of: (target: VArr): VFn => FN_NATIVE(async ([val, fromI], _opts) => {
			expectAny(val);
			if (fromI) {
				assertNumber(fromI);
				const offset = target.value.slice(0, fromI.value).length;
				const result = target.value.slice(fromI.value).findIndex(v => eq(v, val));
				return NUM(result < 0 ? result : result + offset);
			} else {
				return NUM(target.value.findIndex(v => eq(v, val)));
			}
		}),

		reverse: (target: VArr): VFn => FN_NATIVE(async (_, _opts) => {
			target.value.reverse();
			return NULL;
		}),

		copy: (target: VArr): VFn => FN_NATIVE(async (_, _opts) => {
			return ARR([...target.value]);
		}),
		sort: (target: VArr): VFn => FN_NATIVE(async ([comp], opts) => {
			const mergeSort = async (arr: Value[], comp: VFn): Promise<Value[]> => {
				if (arr.length <= 1) return arr;
				const mid = Math.floor(arr.length / 2);
				const left_promise = mergeSort(arr.slice(0, mid), comp);
				const right_promise = mergeSort(arr.slice(mid), comp);
				const [left, right] = await Promise.all([left_promise, right_promise]);
				return merge(left, right, comp);
			};
			const merge = async (left: Value[], right: Value[], comp: VFn): Promise<Value[]> => {
				const result: Value[] = [];
				let leftIndex = 0;
				let rightIndex = 0;
				while (leftIndex < left.length && rightIndex < right.length) {
					const l = left[leftIndex]!;
					const r = right[rightIndex]!;
					const compValue = await opts.call(comp, [l, r]);
					assertNumber(compValue);
					if (compValue.value <= 0) {
						result.push(left[leftIndex]!);
						leftIndex++;
					} else {
						result.push(right[rightIndex]!);
						rightIndex++;
					}
				}
				return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
			};

			assertFunction(comp);
			assertArray(target);
			target.value = await mergeSort(target.value, comp);
			return target;
		}),
		
		fill: (target: VArr): VFn => FN_NATIVE(async ([val, st, ed], opts) => {
			const value = val ?? NULL;
			const start = st && (assertNumber(st), st.value);
			const end = ed && (assertNumber(ed), ed.value);
			target.value.fill(value, start, end);
			return target;
		}),

		repeat: (target: VArr): VFn => FN_NATIVE(async ([times], opts) => {
			assertNumber(times);
			try {
				return ARR(Array(times.value).fill(target.value).flat());
			} catch (e) {
				if (times.value < 0) throw new AiScriptRuntimeError('arr.repeat expected non-negative number, got negative');
				if (!Number.isInteger(times.value)) throw new AiScriptRuntimeError('arr.repeat expected integer, got non-integer');
				throw e;
			}
		}),
		
		splice: (target: VArr): VFn => FN_NATIVE(async ([idx, rc, vs], opts) => {
			assertNumber(idx);
			const index = (idx.value < -target.value.length) ? 0
				: (idx.value < 0) ? target.value.length + idx.value
				: (idx.value >= target.value.length) ? target.value.length
				: idx.value;

			const remove_count = (rc != null) ? (assertNumber(rc), rc.value)
				: target.value.length - index;

			const items = (vs != null) ? (assertArray(vs), vs.value) : [];

			const result = target.value.splice(index, remove_count, ...items);
			return ARR(result);
		}),

		flat: (target: VArr): VFn => FN_NATIVE(async ([depth], opts) => {
			depth = depth ?? NUM(1);
			assertNumber(depth);
			if (!Number.isInteger(depth.value)) throw new AiScriptRuntimeError('arr.flat expected integer, got non-integer');
			if (depth.value < 0) throw new AiScriptRuntimeError('arr.flat expected non-negative number, got negative');
			const flat = (arr: Value[], depth: number, result: Value[]) => {
				if (depth === 0) {
					result.push(...arr);
					return;
				}
				for (const v of arr) {
					if (isArray(v)) {
						flat(v.value, depth - 1, result);
					} else {
						result.push(v);
					}
				}
			};
			const result: Value[] = [];
			flat(target.value, depth.value, result);
			return ARR(result);
		}),

		flat_map: (target: VArr): VFn => FN_NATIVE(async ([fn], opts) => {
			assertFunction(fn);
			const vals = target.value.map(async (item, i) => {
				const result = await opts.call(fn, [item, NUM(i)]);
				return isArray(result) ? result.value : result;
			});
			const mapped_vals = await Promise.all(vals);
			return ARR(mapped_vals.flat());
		}),

		every: (target: VArr): VFn => FN_NATIVE(async ([fn], opts) => {
			assertFunction(fn);
			for (const [i, item] of target.value.entries()) {
				const res = await opts.call(fn, [item, NUM(i)]);
				assertBoolean(res);
				if (!res.value) return FALSE;
			}
			return TRUE;
		}),

		some: (target: VArr): VFn => FN_NATIVE(async ([fn], opts) => {
			assertFunction(fn);
			for (const [i, item] of target.value.entries()) {
				const res = await opts.call(fn, [item, NUM(i)]);
				assertBoolean(res);
				if (res.value) return TRUE;
			}
			return FALSE;
		}),

		insert: (target: VArr): VFn => FN_NATIVE(async ([index, item], opts) => {
			assertNumber(index);
			expectAny(item);

			target.value.splice(index.value, 0, item);

			return NULL;
		}),

		remove: (target: VArr): VFn => FN_NATIVE(async ([index], opts) => {
			assertNumber(index);

			const removed = target.value.splice(index.value, 1);

			return removed[0] ?? NULL;
		}),

		at: (target: VArr): VFn => FN_NATIVE(async ([index, otherwise], opts) => {
			assertNumber(index);
			return target.value.at(index.value) ?? otherwise ?? NULL;
		}),
	})),

	error: new Map(Object.entries({
		name: (target: VError): VStr => STR(target.value), 

		info: (target: VError): Value => target.info ?? NULL,
	})),
} as const;

export function getPrimProp(target: Value, name: string): Value {
	const props = PRIMITIVE_PROPS[target.type];
	if (props != null) {
		const prop = props.get(name);
		if (prop != null) {
			return prop(target);
		} else {
			throw new AiScriptRuntimeError(`No such prop (${name}) in ${target.type}.`);
		}
	} else {
		throw new AiScriptRuntimeError(`Cannot read prop of ${target.type}. (reading ${name})`);
	}
}
