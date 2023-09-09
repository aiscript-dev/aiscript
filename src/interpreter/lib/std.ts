/* eslint-disable no-empty-pattern */
import { v4 as uuid } from 'uuid';
import seedrandom from 'seedrandom';
import { NUM, STR, FN_NATIVE, FALSE, TRUE, ARR, NULL, BOOL, OBJ, ERROR } from '../value.js';
import { assertNumber, assertString, assertBoolean, valToJs, jsToVal, assertFunction, assertObject, eq, expectAny, assertArray, reprValue } from '../util.js';
import { RuntimeError } from '../../error.js';
import type { Value } from '../value.js';
import { Variable } from '../variable.js';

export const std: Record<string, Variable> = {
	'help': Variable.const(STR('SEE: https://github.com/syuilo/aiscript/blob/master/docs/get-started.md')),

	//#region Core
	'Core:v': Variable.const(STR('0.15.0')), // TODO: package.jsonを参照

	'Core:ai': Variable.const(STR('kawaii')),

	'Core:not': Variable.const(FN_NATIVE(([a]) => {
		assertBoolean(a);
		return a.value ? FALSE : TRUE;
	})),

	'Core:eq': Variable.const(FN_NATIVE(([a, b]) => {
		expectAny(a);
		expectAny(b);
		return eq(a, b) ? TRUE : FALSE;
	})),

	'Core:neq': Variable.const(FN_NATIVE(([a, b]) => {
		expectAny(a);
		expectAny(b);
		return eq(a, b) ? FALSE : TRUE;
	})),

	'Core:and': Variable.const(FN_NATIVE(([a, b]) => {
		assertBoolean(a);
		if (!a.value) return FALSE;
		assertBoolean(b);
		return b.value ? TRUE : FALSE;
	})),

	'Core:or': Variable.const(FN_NATIVE(([a, b]) => {
		assertBoolean(a);
		if (a.value) return TRUE;
		assertBoolean(b);
		return b.value ? TRUE : FALSE;
	})),

	'Core:add': Variable.const(FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		return NUM(a.value + b.value);
	})),

	'Core:sub': Variable.const(FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		return NUM(a.value - b.value);
	})),

	'Core:mul': Variable.const(FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		return NUM(a.value * b.value);
	})),

	'Core:pow': Variable.const(FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		const res = a.value ** b.value;
		if (isNaN(res)) throw new RuntimeError('Invalid operation.'); // ex. √-1
		return NUM(res);
	})),

	'Core:div': Variable.const(FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		const res = a.value / b.value;
		if (isNaN(res)) throw new RuntimeError('Invalid operation.');
		return NUM(res);
	})),

	'Core:mod': Variable.const(FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		return NUM(a.value % b.value);
	})),

	'Core:gt': Variable.const(FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		return a.value > b.value ? TRUE : FALSE;
	})),

	'Core:lt': Variable.const(FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		return a.value < b.value ? TRUE : FALSE;
	})),

	'Core:gteq': Variable.const(FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		return a.value >= b.value ? TRUE : FALSE;
	})),

	'Core:lteq': Variable.const(FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		return a.value <= b.value ? TRUE : FALSE;
	})),

	'Core:type': Variable.const(FN_NATIVE(([v]) => {
		expectAny(v);
		return STR(v.type);
	})),

	'Core:to_str': Variable.const(FN_NATIVE(([v]) => {
		expectAny(v);

		return STR(reprValue(v));
	})),

	'Core:range': Variable.const(FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		if (a.value < b.value) {
			return ARR(Array.from({ length: (b.value - a.value) + 1 }, (_, i) => NUM(i + a.value)));
		} else if (a.value > b.value) {
			return ARR(Array.from({ length: (a.value - b.value) + 1 }, (_, i) => NUM(a.value - i)));
		} else {
			return ARR([a]);
		}
	})),
	'Core:sleep': Variable.const(FN_NATIVE(async ([delay]) => {
		assertNumber(delay);
		await new Promise((r) => setTimeout(r, delay.value));
		return NULL;
	})),
	//#endregion

	//#region Util
	'Util:uuid': Variable.const(FN_NATIVE(() => {
		return STR(uuid());
	})),
	//#endregion

	//#region Json
	'Json:stringify': Variable.const(FN_NATIVE(([v]) => {
		expectAny(v);
		return STR(JSON.stringify(valToJs(v)));
	})),

	'Json:parse': Variable.const(FN_NATIVE(([json]) => {
		assertString(json);
		try {
			return jsToVal(JSON.parse(json.value));
		} catch (e) {
			return ERROR('not_json');
		}
	})),

	'Json:parsable': Variable.const(FN_NATIVE(([str]) => {
		assertString(str);
		try {
			JSON.parse(str.value);
		} catch (e) {
			return BOOL(false);
		}
		return BOOL(true);
	})),
	//#endregion

	//#region Date
	'Date:now': Variable.const(FN_NATIVE(() => {
		return NUM(Date.now());
	})),

	'Date:year': Variable.const(FN_NATIVE(([v]) => {
		if (v) { assertNumber(v); }
		return NUM(new Date(v?.value || Date.now()).getFullYear());
	})),

	'Date:month': Variable.const(FN_NATIVE(([v]) => {
		if (v) { assertNumber(v); }
		return NUM(new Date(v?.value || Date.now()).getMonth() + 1);
	})),

	'Date:day': Variable.const(FN_NATIVE(([v]) => {
		if (v) { assertNumber(v); }
		return NUM(new Date(v?.value || Date.now()).getDate());
	})),

	'Date:hour': Variable.const(FN_NATIVE(([v]) => {
		if (v) { assertNumber(v); }
		return NUM(new Date(v?.value || Date.now()).getHours());
	})),

	'Date:minute': Variable.const(FN_NATIVE(([v]) => {
		if (v) { assertNumber(v); }
		return NUM(new Date(v?.value || Date.now()).getMinutes());
	})),

	'Date:second': Variable.const(FN_NATIVE(([v]) => {
		if (v) { assertNumber(v); }
		return NUM(new Date(v?.value || Date.now()).getSeconds());
	})),

	'Date:parse': Variable.const(FN_NATIVE(([v]) => {
		assertString(v);
		return NUM(new Date(v.value).getTime());
	})),
	//#endregion

	//#region Math
	'Math:Infinity': Variable.const(NUM(Infinity)),

	'Math:E': Variable.const(NUM(Math.E)),
	'Math:LN2': Variable.const(NUM(Math.LN2)),
	'Math:LN10': Variable.const(NUM(Math.LN10)),
	'Math:LOG2E': Variable.const(NUM(Math.LOG2E)),
	'Math:LOG10E': Variable.const(NUM(Math.LOG10E)),
	'Math:PI': Variable.const(NUM(Math.PI)),
	'Math:SQRT1_2': Variable.const(NUM(Math.SQRT1_2)),
	'Math:SQRT2': Variable.const(NUM(Math.SQRT2)),

	'Math:abs': Variable.const(FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.abs(v.value));
	})),

	'Math:acos': Variable.const(FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.acos(v.value));
	})),

	'Math:acosh': Variable.const(FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.acosh(v.value));
	})),

	'Math:asin': Variable.const(FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.asin(v.value));
	})),

	'Math:asinh': Variable.const(FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.asinh(v.value));
	})),

	'Math:atan': Variable.const(FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.atan(v.value));
	})),

	'Math:atanh': Variable.const(FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.atanh(v.value));
	})),

	'Math:atan2': Variable.const(FN_NATIVE(([y, x]) => {
		assertNumber(y);
		assertNumber(x);
		return NUM(Math.atan2(y.value, x.value));
	})),

	'Math:cbrt': Variable.const(FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.cbrt(v.value));
	})),

	'Math:ceil': Variable.const(FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.ceil(v.value));
	})),

	'Math:clz32': Variable.const(FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.clz32(v.value));
	})),

	'Math:cos': Variable.const(FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.cos(v.value));
	})),

	'Math:cosh': Variable.const(FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.cosh(v.value));
	})),

	'Math:exp': Variable.const(FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.exp(v.value));
	})),

	'Math:expm1': Variable.const(FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.expm1(v.value));
	})),

	'Math:floor': Variable.const(FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.floor(v.value));
	})),

	'Math:fround': Variable.const(FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.fround(v.value));
	})),

	'Math:hypot': Variable.const(FN_NATIVE(([vs]) => {
		assertArray(vs);
		const values = [];
		for (const v of vs.value) {
			assertNumber(v);
			values.push(v.value);
		}
		return NUM(Math.hypot(...values));
	})),

	'Math:imul': Variable.const(FN_NATIVE(([x, y]) => {
		assertNumber(x);
		assertNumber(y);
		return NUM(Math.imul(x.value, y.value));
	})),

	'Math:log': Variable.const(FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.log(v.value));
	})),

	'Math:log1p': Variable.const(FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.log1p(v.value));
	})),

	'Math:log10': Variable.const(FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.log10(v.value));
	})),

	'Math:log2': Variable.const(FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.log2(v.value));
	})),

	'Math:max': Variable.const(FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		return NUM(Math.max(a.value, b.value));
	})),

	'Math:min': Variable.const(FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		return NUM(Math.min(a.value, b.value));
	})),

	'Math:pow': Variable.const(FN_NATIVE(([x, y]) => {
		assertNumber(x);
		assertNumber(y);
		return NUM(Math.pow(x.value, y.value));
	})),

	'Math:round': Variable.const(FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.round(v.value));
	})),

	'Math:sign': Variable.const(FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.sign(v.value));
	})),

	'Math:sin': Variable.const(FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.sin(v.value));
	})),

	'Math:sinh': Variable.const(FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.sinh(v.value));
	})),

	'Math:sqrt': Variable.const(FN_NATIVE(([v]) => {
		assertNumber(v);
		const res = Math.sqrt(v.value);
		if (isNaN(res)) throw new RuntimeError('Invalid operation.');
		return NUM(res);
	})),

	'Math:tan': Variable.const(FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.tan(v.value));
	})),

	'Math:tanh': Variable.const(FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.tanh(v.value));
	})),

	'Math:trunc': Variable.const(FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.trunc(v.value));
	})),

	'Math:rnd': Variable.const(FN_NATIVE(([min, max]) => {
		if (min && min.type === 'num' && max && max.type === 'num') {
			return NUM(Math.floor(Math.random() * (Math.floor(max.value) - Math.ceil(min.value) + 1) + Math.ceil(min.value)));
		}
		return NUM(Math.random());
	})),

	'Math:gen_rng': Variable.const(FN_NATIVE(([seed]) => {
		expectAny(seed);
		if (seed.type !== 'num' && seed.type !== 'str') return NULL;

		const rng = seedrandom(seed.value.toString());

		return FN_NATIVE(([min, max]) => {
			if (min && min.type === 'num' && max && max.type === 'num') {
				return NUM(Math.floor(rng() * (Math.floor(max.value) - Math.ceil(min.value) + 1) + Math.ceil(min.value)));
			}
			return NUM(rng());
		});
	})),
	//#endregion

	//#region Num
	'Num:to_hex': Variable.const(FN_NATIVE(([v]) => {
		assertNumber(v);
		return STR(v.value.toString(16));
	})),

	'Num:from_hex': Variable.const(FN_NATIVE(([v]) => {
		assertString(v);
		return NUM(parseInt(v.value, 16));
	})),
	//#endregion

	//#region Str
	'Str:lf': Variable.const(STR('\n')),

	'Str:lt': Variable.const(FN_NATIVE(([a, b]) => {
		assertString(a);
		assertString(b);
		if (a.value < b.value) {
			return NUM(-1);
		} else if (a.value === b.value) {
			return NUM(0);
		} else {
			return NUM(1);
		}
	})),

	'Str:gt': Variable.const(FN_NATIVE(([a, b]) => {
		assertString(a);
		assertString(b);
		if (a.value > b.value) {
			return NUM(-1);
		} else if (a.value === b.value) {
			return NUM(0);
		} else {
			return NUM(1);
		}
	})),

	'Str:from_codepoint': Variable.const(FN_NATIVE(([codePoint]) => {
		assertNumber(codePoint);

		return STR(String.fromCodePoint(codePoint.value));
	})),
	//#endregion

	//#region Arr
	//#endregion

	//#region Obj
	'Obj:keys': Variable.const(FN_NATIVE(([obj]) => {
		assertObject(obj);
		return ARR(Array.from(obj.value.keys()).map(k => STR(k)));
	})),

	'Obj:vals': Variable.const(FN_NATIVE(([obj]) => {
		assertObject(obj);
		return ARR(Array.from(obj.value.values()));
	})),

	'Obj:kvs': Variable.const(FN_NATIVE(([obj]) => {
		assertObject(obj);
		return ARR(Array.from(obj.value.entries()).map(([k, v]) => ARR([STR(k), v])));
	})),

	'Obj:get': Variable.const(FN_NATIVE(([obj, key]) => {
		assertObject(obj);
		assertString(key);
		return obj.value.get(key.value) ?? NULL;
	})),

	'Obj:set': Variable.const(FN_NATIVE(([obj, key, value]) => {
		assertObject(obj);
		assertString(key);
		expectAny(value);
		obj.value.set(key.value, value);
		return NULL;
	})),

	'Obj:has': Variable.const(FN_NATIVE(([obj, key]) => {
		assertObject(obj);
		assertString(key);
		return BOOL(obj.value.has(key.value));
	})),

	'Obj:copy': Variable.const(FN_NATIVE(([obj]) => {
		assertObject(obj);
		return OBJ(new Map(obj.value));
	})),

	/* TODO
	'Obj:merge': Variable.const(FN_NATIVE(([a, b]) => {
		assertObject(a);
		assertObject(b);
		return OBJ();
	})),
	*/
	//#endregion

	//#region Async
	'Async:interval': Variable.const(FN_NATIVE(async ([interval, callback, immediate], opts) => {
		assertNumber(interval);
		assertFunction(callback);
		if (immediate) {
			assertBoolean(immediate);
			if (immediate.value) opts.call(callback, []);
		}

		const id = setInterval(() => {
			opts.call(callback, []);
		}, interval.value);

		const abortHandler = (): void => {
			clearInterval(id);
		};

		opts.registerAbortHandler(abortHandler);

		// stopper
		return FN_NATIVE(([], opts) => {
			clearInterval(id);
			opts.unregisterAbortHandler(abortHandler);
		});
	})),

	'Async:timeout': Variable.const(FN_NATIVE(async ([delay, callback], opts) => {
		assertNumber(delay);
		assertFunction(callback);

		const id = setTimeout(() => {
			opts.call(callback, []);
		}, delay.value);

		const abortHandler = (): void => {
			clearTimeout(id);
		};

		opts.registerAbortHandler(abortHandler);

		// stopper
		return FN_NATIVE(([], opts) => {
			clearTimeout(id);
			opts.unregisterAbortHandler(abortHandler);
		});
	})),
	//#endregion
};
