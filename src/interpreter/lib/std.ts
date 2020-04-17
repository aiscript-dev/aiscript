import { v4 as uuid } from 'uuid';
import * as seedrandom from 'seedrandom';
import { Value, NUM, STR, FN_NATIVE, FALSE, TRUE, VArr, ARR, NULL, OBJ } from '../value';
import { assertNumber, assertString, assertArray, assertBoolean, valToJs, jsToVal, assertFunction, assertObject } from '../util';
import { AiScriptError } from '../error';
const pkg = require('../../../package.json');

export const std: Record<string, Value> = {
	'help': STR('SEE: https://github.com/syuilo/aiscript/blob/master/docs/get-started.md'),

	'Core:v': STR(pkg.version),

	'Core:ai': STR('kawaii'),

	'Core:not': FN_NATIVE(([a]) => {
		assertBoolean(a);
		return a.value ? FALSE : TRUE;
	}),

	'Core:eq': FN_NATIVE(([a, b]) => {
		if (a.type === 'fn' || b.type === 'fn') return FALSE;
		if (a.type === 'null' && b.type === 'null') return TRUE;
		if (a.type === 'null' || b.type === 'null') return FALSE;
		return (a.value === b.value) ? TRUE : FALSE;
	}),

	'Core:and': FN_NATIVE(([a, b]) => {
		assertBoolean(a);
		assertBoolean(b);
		return (a.value && b.value) ? TRUE : FALSE;
	}),

	'Core:or': FN_NATIVE(([a, b]) => {
		assertBoolean(a);
		assertBoolean(b);
		return (a.value || b.value) ? TRUE : FALSE;
	}),

	'Core:add': FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		return NUM(a.value + b.value);
	}),

	'Core:sub': FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		return NUM(a.value - b.value);
	}),

	'Core:mul': FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		return NUM(a.value * b.value);
	}),

	'Core:div': FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		const res = a.value / b.value;
		if (isNaN(res)) throw new AiScriptError('Invalid operation.');
		return NUM(res);
	}),

	'Core:mod': FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		return NUM(a.value % b.value);
	}),

	'Core:gt': FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		return a.value > b.value ? TRUE : FALSE;
	}),

	'Core:lt': FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		return a.value < b.value ? TRUE : FALSE;
	}),

	'Core:type': FN_NATIVE(([v]) => {
		return STR(v.type);
	}),

	'Core:to_str': FN_NATIVE(([v]) => {
		if (v.type === 'str') return v;
		if (v.type === 'num') return STR(v.value.toString());
		return STR('?');
	}),

	'Util:uuid': FN_NATIVE(() => {
		return STR(uuid());
	}),

	'Json:stringify': FN_NATIVE(([v]) => {
		return STR(JSON.stringify(valToJs(v)));
	}),

	'Json:parse': FN_NATIVE(([json]) => {
		assertString(json);
		return jsToVal(JSON.parse(json.value));
	}),

	'Date:now': FN_NATIVE(() => {
		return NUM(Date.now());
	}),

	'Date:year': FN_NATIVE(() => {
		return NUM(new Date().getFullYear());
	}),

	'Date:month': FN_NATIVE(() => {
		return NUM(new Date().getMonth() + 1);
	}),

	'Date:day': FN_NATIVE(() => {
		return NUM(new Date().getDate());
	}),

	'Date:hour': FN_NATIVE(() => {
		return NUM(new Date().getHours());
	}),

	'Date:minute': FN_NATIVE(() => {
		return NUM(new Date().getMinutes());
	}),

	'Date:second': FN_NATIVE(() => {
		return NUM(new Date().getSeconds());
	}),

	'Math:PI': NUM(Math.PI),

	'Math:sin': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.sin(v.value));
	}),

	'Math:cos': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.cos(v.value));
	}),

	'Math:abs': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.abs(v.value));
	}),

	'Math:sqrt': FN_NATIVE(([v]) => {
		assertNumber(v);
		const res = Math.sqrt(v.value);
		if (isNaN(res)) throw new AiScriptError('Invalid operation.');
		return NUM(res);
	}),

	'Math:round': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.round(v.value));
	}),

	'Math:floor': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.floor(v.value));
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

	'Math:rnd': FN_NATIVE(([min, max]) => {
		if (min && min.type === 'num' && max && max.type === 'num') {
			return NUM(Math.floor(Math.random() * (max.value - min.value + 1) + min.value));
		}
		return NUM(Math.random());
	}),

	'Math:gen_rng': FN_NATIVE(([seed]) => {
		if (seed.type !== 'num' && seed.type !== 'str') return NULL;

		const rng = seedrandom(seed.value.toString());

		return FN_NATIVE(([min, max]) => {
			if (min && min.type === 'num' && max && max.type === 'num') {
				return NUM(Math.floor(rng() * (max.value - min.value + 1) + min.value));
			}
			return NUM(rng());
		});
	}),

	'Str:to_num': FN_NATIVE(([v]) => {
		if (v.type === 'num') return v;
		if (v.type === 'str') {
			const parsed = parseInt(v.value, 10);
			if (isNaN(parsed)) return NULL;
			return NUM(parsed);
		}
		return NULL;
	}),

	'Str:len': FN_NATIVE(([v]) => {
		if (v.type !== 'str') return NUM(0);
		return NUM(v.value.length);
	}),

	'Str:pick': FN_NATIVE(([v, i]) => {
		assertString(v);
		assertNumber(i);
		const char = v.value[i.value - 1];
		return char ? STR(v.value[i.value - 1]) : NULL;
	}),

	'Str:incl': FN_NATIVE(([v, keyword]) => {
		assertString(v);
		assertString(keyword);
		return v.value.includes(keyword.value) ? TRUE : FALSE;
	}),

	'Str:slice': FN_NATIVE(([v, begin, end]) => {
		assertString(v);
		assertNumber(begin);
		assertNumber(end);
		return STR(v.value.substring(begin.value - 1, end.value - 1));
	}),

	'Str:split': FN_NATIVE(([v, splitter]) => {
		assertString(v);
		if (splitter) assertString(splitter);
		return ARR(v.value.split(splitter ? splitter.value : '').map(s => STR(s)));
	}),

	'Str:replace': FN_NATIVE(([v, a, b]) => {
		assertString(v);
		assertString(a);
		assertString(b);
		return STR(v.value.split(a.value).join(b.value));
	}),

	'Str:index_of': FN_NATIVE(([v, search]) => {
		assertString(v);
		assertString(search);
		return NUM(v.value.indexOf(search.value) + 1);
	}),

	'Str:trim': FN_NATIVE(([v]) => {
		assertString(v);
		return STR(v.value.trim());
	}),

	'Arr:len': FN_NATIVE(([arr]) => {
		if (arr.type !== 'arr') return NUM(0);
		return NUM(arr.value.length);
	}),

	'Arr:push': FN_NATIVE(([arr, val]) => {
		assertArray(arr);
		return ARR([...arr.value, val]);
	}),

	'Arr:unshift': FN_NATIVE(([arr, val]) => {
		assertArray(arr);
		return ARR([val, ...arr.value]);
	}),

	'Arr:pop': FN_NATIVE(([arr]) => {
		assertArray(arr);
		return ARR(arr.value.slice(0, arr.value.length - 1));
	}),

	'Arr:shift': FN_NATIVE(([arr]) => {
		assertArray(arr);
		return ARR(arr.value.slice(1, arr.value.length));
	}),

	'Arr:concat': FN_NATIVE(([a, b]) => {
		assertArray(a);
		assertArray(b);
		return ARR(a.value.concat(b.value));
	}),

	'Arr:join': FN_NATIVE(([arr, joiner]) => {
		assertArray(arr);
		if (joiner) assertString(joiner);
		return STR(arr.value.map(i => i.type === 'str' ? i.value : '').join(joiner ? joiner.value : ''));
	}),

	'Arr:slice': FN_NATIVE(([arr, begin, end]) => {
		assertArray(arr);
		assertNumber(begin);
		assertNumber(end);
		return ARR(arr.value.slice(begin.value - 1, end.value - 1));
	}),

	'Arr:incl': FN_NATIVE(([arr, val]) => {
		assertArray(arr);
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
		return getValue(arr).includes(val.type === 'null' ? null : val.value) ? TRUE : FALSE;
	}),

	'Arr:map': FN_NATIVE(async ([arr, fn], opts) => {
		assertArray(arr);
		assertFunction(fn);
		const vals = arr.value.map(async (item, i) => {
			return await opts.call(fn, [item, NUM(i + 1)]);
		});
		return ARR(await Promise.all(vals));
	}),

	'Arr:filter': FN_NATIVE(async ([arr, fn], opts) => {
		assertArray(arr);
		assertFunction(fn);
		const vals = [] as Value[];
		for (let i = 0; i < arr.value.length; i++) {
			const item = arr.value[i];
			const res = await opts.call(fn, [item, NUM(i + 1)]);
			assertBoolean(res);
			if (res.value) vals.push(item);
		}
		return ARR(vals);
	}),

	'Arr:reduce': FN_NATIVE(async ([arr, fn, initialValue], opts) => {
		assertArray(arr);
		assertFunction(fn);
		const withInitialValue = initialValue != null;
		let accumulator = withInitialValue ? initialValue : arr.value[0];
		for (let i = withInitialValue ? 0 : 1; i < arr.value.length; i++) {
			const item = arr.value[i];
			accumulator = await opts.call(fn, [accumulator, item, NUM(i + 1)]);
		}
		return accumulator;
	}),

	'Arr:find': FN_NATIVE(async ([arr, fn], opts) => {
		assertArray(arr);
		assertFunction(fn);
		for (let i = 0; i < arr.value.length; i++) {
			const item = arr.value[i];
			const res = await opts.call(fn, [item, NUM(i + 1)]);
			assertBoolean(res);
			if (res.value) return item;
		}
		return NULL;
	}),

	'Arr:reverse': FN_NATIVE(([arr]) => {
		assertArray(arr);
		return ARR(arr.value.slice().reverse());
	}),

	'Arr:replace': FN_NATIVE(async ([arr, i, v]) => {
		assertArray(arr);
		assertNumber(i);
		const items = arr.value.slice();
		items[i.value - 1] = v;
		return ARR(items);
	}),

	'Obj:keys': FN_NATIVE(([obj]) => {
		assertObject(obj);
		return ARR(Object.keys(obj.value).map(k => STR(k)));
	}),

	'Obj:kvs': FN_NATIVE(([obj]) => {
		assertObject(obj);
		return ARR(Object.entries(obj.value).map(([k, v]) => ARR([STR(k), v])));
	}),

	/* TODO
	'Obj:merge': FN_NATIVE(([a, b]) => {
		assertObject(a);
		assertObject(b);
		return OBJ();
	}),
	*/

	'Async:interval': FN_NATIVE(async ([interval, callback, immediate], opts) => {
		assertNumber(interval);
		assertFunction(callback);
		if (immediate) assertBoolean(immediate);

		if (immediate) opts.call(callback, []);

		const id = setInterval(() => {
			opts.call(callback, []);
		}, interval.value);

		const abortHandler = () => {
			clearInterval(id);
		};

		opts.registerAbortHandler(abortHandler);

		// stopper
		return FN_NATIVE(([], opts) => {
			clearInterval(id);
			opts.unregisterAbortHandler(abortHandler);
		});
	}),

	'Async:timeout': FN_NATIVE(async ([delay, callback], opts) => {
		assertNumber(delay);
		assertFunction(callback);

		const id = setTimeout(() => {
			opts.call(callback, []);
		}, delay.value);

		const abortHandler = () => {
			clearTimeout(id);
		};

		opts.registerAbortHandler(abortHandler);

		// stopper
		return FN_NATIVE(([], opts) => {
			clearTimeout(id);
			opts.unregisterAbortHandler(abortHandler);
		});
	}),
};
