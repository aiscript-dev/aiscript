/* eslint-disable no-empty-pattern */
import { v4 as uuid } from 'uuid';
import { substring, length, indexOf, toArray } from 'stringz';
import seedrandom from 'seedrandom';
import { NUM, STR, FN_NATIVE, FALSE, TRUE, VArr, ARR, NULL, BOOL, OBJ } from '../value';
import { assertNumber, assertString, assertArray, assertBoolean, valToJs, jsToVal, assertFunction, assertObject, eq, expectAny } from '../util';
import { RuntimeError } from '../../error';
import type { Value } from '../value';

export const std: Record<string, Value> = {
	'help': STR('SEE: https://github.com/syuilo/aiscript/blob/master/docs/get-started.md'),

	//#region Core
	'Core:v': STR('0.13.1'), // TODO: package.jsonを参照

	'Core:ai': STR('kawaii'),

	'Core:not': FN_NATIVE(([a]) => {
		assertBoolean(a);
		return a.value ? FALSE : TRUE;
	}),

	'Core:eq': FN_NATIVE(([a, b]) => {
		expectAny(a);
		expectAny(b);
		return eq(a, b) ? TRUE : FALSE;
	}),

	'Core:neq': FN_NATIVE(([a, b]) => {
		expectAny(a);
		expectAny(b);
		return eq(a, b) ? FALSE : TRUE;
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

	'Core:pow': FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		const res = a.value ** b.value;
		if (isNaN(res)) throw new RuntimeError('Invalid operation.'); // ex. √-1
		return NUM(res);
	}),

	'Core:div': FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		const res = a.value / b.value;
		if (isNaN(res)) throw new RuntimeError('Invalid operation.');
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

	'Core:gteq': FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		return a.value >= b.value ? TRUE : FALSE;
	}),

	'Core:lteq': FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		return a.value <= b.value ? TRUE : FALSE;
	}),

	'Core:type': FN_NATIVE(([v]) => {
		expectAny(v);
		return STR(v.type);
	}),

	'Core:to_str': FN_NATIVE(([v]) => {
		expectAny(v);
		if (v.type === 'str') return v;
		if (v.type === 'num') return STR(v.value.toString());
		return STR('?');
	}),

	'Core:range': FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		if (a.value < b.value) {
			return ARR(Array.from({ length: (b.value - a.value) + 1 }, (_, i) => NUM(i + a.value)));
		} else if (a.value > b.value) {
			return ARR(Array.from({ length: (a.value - b.value) + 1 }, (_, i) => NUM(a.value - i)));
		} else {
			return ARR([a]);
		}
	}),
	//#endregion

	//#region Util
	'Util:uuid': FN_NATIVE(() => {
		return STR(uuid());
	}),
	//#endregion

	//#region Json
	'Json:stringify': FN_NATIVE(([v]) => {
		expectAny(v);
		return STR(JSON.stringify(valToJs(v)));
	}),

	'Json:parse': FN_NATIVE(([json]) => {
		assertString(json);
		return jsToVal(JSON.parse(json.value));
	}),
	//#endregion

	//#region Date
	'Date:now': FN_NATIVE(() => {
		return NUM(Date.now());
	}),

	'Date:year': FN_NATIVE(([v]) => {
		if (v) { assertNumber(v) }
		return NUM(new Date(v?.value || Date.now()).getFullYear());
	}),

	'Date:month': FN_NATIVE(([v]) => {
		if (v) { assertNumber(v) }
		return NUM(new Date(v?.value || Date.now()).getMonth() + 1);
	}),

	'Date:day': FN_NATIVE(([v]) => {
		if (v) { assertNumber(v) }
		return NUM(new Date(v?.value || Date.now()).getDate());
	}),

	'Date:hour': FN_NATIVE(([v]) => {
		if (v) { assertNumber(v) }
		return NUM(new Date(v?.value || Date.now()).getHours());
	}),

	'Date:minute': FN_NATIVE(([v]) => {
		if (v) { assertNumber(v) }
		return NUM(new Date(v?.value || Date.now()).getMinutes());
	}),

	'Date:second': FN_NATIVE(([v]) => {
		if (v) { assertNumber(v) }
		return NUM(new Date(v?.value || Date.now()).getSeconds());
	}),

	'Date:parse': FN_NATIVE(([v]) => {
		assertString(v);
		return NUM(new Date(v.value).getTime());
	}),
	//#endregion

	//#region Math
	'Math:Infinity': NUM(Infinity),

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
		if (isNaN(res)) throw new RuntimeError('Invalid operation.');
		return NUM(res);
	}),

	'Math:round': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.round(v.value));
	}),

	'Math:ceil': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.ceil(v.value));
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
			return NUM(Math.floor(Math.random() * (Math.floor(max.value) - Math.ceil(min.value) + 1) + Math.ceil(min.value)));
		}
		return NUM(Math.random());
	}),

	'Math:gen_rng': FN_NATIVE(([seed]) => {
		expectAny(seed);
		if (seed.type !== 'num' && seed.type !== 'str') return NULL;

		const rng = seedrandom(seed.value.toString());

		return FN_NATIVE(([min, max]) => {
			if (min && min.type === 'num' && max && max.type === 'num') {
				return NUM(Math.floor(rng() * (Math.floor(max.value) - Math.ceil(min.value)) + Math.ceil(min.value)));
			}
			return NUM(rng());
		});
	}),
	//#endregion

	//#region Num
	'Num:to_hex': FN_NATIVE(([v]) => {
		assertNumber(v);
		return STR(v.value.toString(16));
	}),

	'Num:from_hex': FN_NATIVE(([v]) => {
		assertString(v);
		return NUM(parseInt(v.value, 16));
	}),
	//#endregion

	//#region Str
	'Str:lf': STR('\n'),

	'Str:lt': FN_NATIVE(([a, b]) => {
		assertString(a);
		assertString(b);
		if (a.value < b.value) {
			return NUM(-1);
		}else if (a.value === b.value){
			return NUM(0);
		}else {
			return NUM(1);
		}
	}),
	'Str:gt': FN_NATIVE(([a, b]) => {
		assertString(a);
		assertString(b);
		if (a.value > b.value) {
			return NUM(-1);
		}else if (a.value === b.value){
			return NUM(0);
		}else {
			return NUM(1);
		}
	}),
	//#endregion

	//#region Arr
	//#endregion

	//#region Obj
	'Obj:keys': FN_NATIVE(([obj]) => {
		assertObject(obj);
		return ARR(Array.from(obj.value.keys()).map(k => STR(k)));
	}),

	'Obj:kvs': FN_NATIVE(([obj]) => {
		assertObject(obj);
		return ARR(Array.from(obj.value.entries()).map(([k, v]) => ARR([STR(k), v])));
	}),

	'Obj:get': FN_NATIVE(([obj, key]) => {
		assertObject(obj);
		assertString(key);
		return obj.value.get(key.value) ?? NULL;
	}),

	'Obj:set': FN_NATIVE(([obj, key, value]) => {
		assertObject(obj);
		assertString(key);
		expectAny(value);
		obj.value.set(key.value, value);
		return NULL;
	}),

	'Obj:has': FN_NATIVE(([obj, key]) => {
		assertObject(obj);
		assertString(key);
		return BOOL(obj.value.has(key.value));
	}),

	'Obj:copy': FN_NATIVE(([obj]) => {
		assertObject(obj);
		return OBJ(new Map(obj.value));
	}),

	/* TODO
	'Obj:merge': FN_NATIVE(([a, b]) => {
		assertObject(a);
		assertObject(b);
		return OBJ();
	}),
	*/
	//#endregion

	//#region Async
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
	//#endregion
};
