/* eslint-disable no-empty-pattern */
import { v4 as uuid } from 'uuid';
import { NUM, STR, FN_NATIVE, FALSE, TRUE, ARR, NULL, BOOL, OBJ, ERROR } from '../value.js';
import { assertNumber, assertString, assertBoolean, valToJs, jsToVal, assertFunction, assertObject, eq, expectAny, assertArray, reprValue } from '../util.js';
import { AiScriptRuntimeError, AiScriptUserError } from '../../error.js';
import { AISCRIPT_VERSION } from '../../constants.js';
import { textDecoder } from '../../const.js';
import { CryptoGen } from '../../utils/random/CryptoGen.js';
import { GenerateChaCha20Random, GenerateLegacyRandom, GenerateRC4Random } from '../../utils/random/genrng.js';
import type { Value } from '../value.js';

export const std: Record<string, Value> = {
	'help': STR('SEE: https://github.com/syuilo/aiscript/blob/master/docs/get-started.md'),

	//#region Core
	'Core:v': STR(AISCRIPT_VERSION),

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
		if (!a.value) return FALSE;
		assertBoolean(b);
		return b.value ? TRUE : FALSE;
	}),

	'Core:or': FN_NATIVE(([a, b]) => {
		assertBoolean(a);
		if (a.value) return TRUE;
		assertBoolean(b);
		return b.value ? TRUE : FALSE;
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
		return NUM(res);
	}),

	'Core:div': FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		const res = a.value / b.value;
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

		return STR(reprValue(v));
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
	'Core:sleep': FN_NATIVE(async ([delay]) => {
		assertNumber(delay);
		await new Promise((r) => setTimeout(r, delay.value));
		return NULL;
	}),
	'Core:abort': FN_NATIVE(async ([message]) => {
		assertString(message);
		throw new AiScriptUserError(message.value);
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
		try {
			return jsToVal(JSON.parse(json.value));
		} catch (e) {
			return ERROR('not_json');
		}
	}),

	'Json:parsable': FN_NATIVE(([str]) => {
		assertString(str);
		try {
			JSON.parse(str.value);
		} catch (e) {
			return BOOL(false);
		}
		return BOOL(true);
	}),
	//#endregion

	//#region Date
	'Date:now': FN_NATIVE(() => {
		return NUM(Date.now());
	}),

	'Date:year': FN_NATIVE(([v]) => {
		if (v) { assertNumber(v); }
		return NUM(new Date(v?.value ?? Date.now()).getFullYear());
	}),

	'Date:month': FN_NATIVE(([v]) => {
		if (v) { assertNumber(v); }
		return NUM(new Date(v?.value ?? Date.now()).getMonth() + 1);
	}),

	'Date:day': FN_NATIVE(([v]) => {
		if (v) { assertNumber(v); }
		return NUM(new Date(v?.value ?? Date.now()).getDate());
	}),

	'Date:hour': FN_NATIVE(([v]) => {
		if (v) { assertNumber(v); }
		return NUM(new Date(v?.value ?? Date.now()).getHours());
	}),

	'Date:minute': FN_NATIVE(([v]) => {
		if (v) { assertNumber(v); }
		return NUM(new Date(v?.value ?? Date.now()).getMinutes());
	}),

	'Date:second': FN_NATIVE(([v]) => {
		if (v) { assertNumber(v); }
		return NUM(new Date(v?.value ?? Date.now()).getSeconds());
	}),

	'Date:millisecond': FN_NATIVE(([v]) => {
		if (v) { assertNumber(v); }
		return NUM(new Date(v?.value ?? Date.now()).getMilliseconds());
	}),

	'Date:parse': FN_NATIVE(([v]) => {
		assertString(v);
		const res = new Date(v.value).getTime();
		// NaN doesn't equal to itself
		return (res === res) ? NUM(res) : ERROR('not_date');
	}),

	'Date:to_iso_str': FN_NATIVE(([v, ofs]) => {
		if (v) { assertNumber(v); }
		const date = new Date(v?.value ?? Date.now());

		if (ofs) { assertNumber(ofs); }
		const offset = ofs?.value ?? -date.getTimezoneOffset();
		let offset_s: string;
		if (offset === 0) {
			offset_s = 'Z';
		} else {
			const sign = Math.sign(offset);
			const offset_hours = Math.floor(Math.abs(offset) / 60);
			const offset_minutes = Math.abs(offset) % 60;
			date.setUTCHours(date.getUTCHours() + sign * offset_hours);
			date.setUTCMinutes(date.getUTCMinutes() + sign * offset_minutes);

			const sign_s = (offset > 0) ? '+' : '-';
			const offset_hours_s = offset_hours.toString().padStart(2, '0');
			const offset_minutes_s = offset_minutes.toString().padStart(2, '0');
			offset_s = `${sign_s}${offset_hours_s}:${offset_minutes_s}`;
		}

		const y = date.getUTCFullYear().toString().padStart(4, '0');
		const mo = (date.getUTCMonth() + 1).toString().padStart(2, '0');
		const d = date.getUTCDate().toString().padStart(2, '0');
		const h = date.getUTCHours().toString().padStart(2, '0');
		const mi = date.getUTCMinutes().toString().padStart(2, '0');
		const s = date.getUTCSeconds().toString().padStart(2, '0');
		const ms = date.getUTCMilliseconds().toString().padStart(3, '0');

		return STR(`${y}-${mo}-${d}T${h}:${mi}:${s}.${ms}${offset_s}`);
	}),
	//#endregion

	//#region Math
	'Math:Infinity': NUM(Infinity),

	'Math:E': NUM(Math.E),
	'Math:LN2': NUM(Math.LN2),
	'Math:LN10': NUM(Math.LN10),
	'Math:LOG2E': NUM(Math.LOG2E),
	'Math:LOG10E': NUM(Math.LOG10E),
	'Math:PI': NUM(Math.PI),
	'Math:SQRT1_2': NUM(Math.SQRT1_2),
	'Math:SQRT2': NUM(Math.SQRT2),

	'Math:abs': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.abs(v.value));
	}),

	'Math:acos': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.acos(v.value));
	}),

	'Math:acosh': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.acosh(v.value));
	}),

	'Math:asin': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.asin(v.value));
	}),

	'Math:asinh': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.asinh(v.value));
	}),

	'Math:atan': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.atan(v.value));
	}),

	'Math:atanh': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.atanh(v.value));
	}),

	'Math:atan2': FN_NATIVE(([y, x]) => {
		assertNumber(y);
		assertNumber(x);
		return NUM(Math.atan2(y.value, x.value));
	}),

	'Math:cbrt': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.cbrt(v.value));
	}),

	'Math:ceil': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.ceil(v.value));
	}),

	'Math:clz32': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.clz32(v.value));
	}),

	'Math:cos': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.cos(v.value));
	}),

	'Math:cosh': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.cosh(v.value));
	}),

	'Math:exp': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.exp(v.value));
	}),

	'Math:expm1': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.expm1(v.value));
	}),

	'Math:floor': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.floor(v.value));
	}),

	'Math:fround': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.fround(v.value));
	}),

	'Math:hypot': FN_NATIVE(([vs]) => {
		assertArray(vs);
		const values = [];
		for (const v of vs.value) {
			assertNumber(v);
			values.push(v.value);
		}
		return NUM(Math.hypot(...values));
	}),

	'Math:imul': FN_NATIVE(([x, y]) => {
		assertNumber(x);
		assertNumber(y);
		return NUM(Math.imul(x.value, y.value));
	}),

	'Math:log': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.log(v.value));
	}),

	'Math:log1p': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.log1p(v.value));
	}),

	'Math:log10': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.log10(v.value));
	}),

	'Math:log2': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.log2(v.value));
	}),

	'Math:max': FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		return NUM(Math.max(a.value, b.value));
	}),

	'Math:min': FN_NATIVE(([a, b]) => {
		assertNumber(a);
		assertNumber(b);
		return NUM(Math.min(a.value, b.value));
	}),

	'Math:pow': FN_NATIVE(([x, y]) => {
		assertNumber(x);
		assertNumber(y);
		return NUM(Math.pow(x.value, y.value));
	}),

	'Math:round': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.round(v.value));
	}),

	'Math:sign': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.sign(v.value));
	}),

	'Math:sin': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.sin(v.value));
	}),

	'Math:sinh': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.sinh(v.value));
	}),

	'Math:sqrt': FN_NATIVE(([v]) => {
		assertNumber(v);
		const res = Math.sqrt(v.value);
		return NUM(res);
	}),

	'Math:tan': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.tan(v.value));
	}),

	'Math:tanh': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.tanh(v.value));
	}),

	'Math:trunc': FN_NATIVE(([v]) => {
		assertNumber(v);
		return NUM(Math.trunc(v.value));
	}),

	'Math:rnd': FN_NATIVE(([min, max]) => {
		if (min && min.type === 'num' && max && max.type === 'num') {
			const res = CryptoGen.instance.generateRandomIntegerInRange(min.value, max.value);
			return res === null ? NULL : NUM(res);
		}
		return NUM(CryptoGen.instance.generateNumber0To1());
	}),

	'Math:gen_rng': FN_NATIVE(async ([seed, options]) => {
		expectAny(seed);
		let algo = 'chacha20';
		if (options?.type === 'obj') {
			const v = options.value.get('algorithm');
			if (v?.type !== 'str') throw new AiScriptRuntimeError('`options.algorithm` must be string.');
			algo = v.value;
		}
		else if (options?.type !== undefined) {
			throw new AiScriptRuntimeError('`options` must be an object if specified.');
		}
		if (seed.type !== 'num' && seed.type !== 'str' && seed.type !== 'null') throw new AiScriptRuntimeError('`seed` must be either number or string if specified.');
		switch (algo) {
			case 'rc4_legacy':
				return GenerateLegacyRandom(seed);
			case 'rc4':
				return GenerateRC4Random(seed);
			case 'chacha20':
				return await GenerateChaCha20Random(seed);
			default:
				throw new AiScriptRuntimeError('`options.algorithm` must be one of these: `chacha20`, `rc4`, or `rc4_legacy`.');
		}
	}),
	//#endregion

	//#region Num
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
		} else if (a.value === b.value) {
			return NUM(0);
		} else {
			return NUM(1);
		}
	}),

	'Str:gt': FN_NATIVE(([a, b]) => {
		assertString(a);
		assertString(b);
		if (a.value > b.value) {
			return NUM(-1);
		} else if (a.value === b.value) {
			return NUM(0);
		} else {
			return NUM(1);
		}
	}),

	'Str:from_codepoint': FN_NATIVE(([codePoint]) => {
		assertNumber(codePoint);

		return STR(String.fromCodePoint(codePoint.value));
	}),

	'Str:from_unicode_codepoints': FN_NATIVE(([codePoints]) => {
		assertArray(codePoints);
		return STR(Array.from(codePoints.value.map((a) => {
			assertNumber(a);
			return String.fromCodePoint(a.value);
		})).join(''));
	}),
	
	'Str:from_utf8_bytes': FN_NATIVE(([bytes]) => {
		assertArray(bytes);
		return STR(textDecoder.decode(Uint8Array.from(bytes.value.map((a) => {
			assertNumber(a);
			return a.value;
		}))));
	}),
	//#endregion

	//#region Uri
	'Uri:encode_full': FN_NATIVE(([v]) => {
		assertString(v);
		return STR(encodeURI(v.value));
	}),	

	'Uri:encode_component': FN_NATIVE(([v]) => {
		assertString(v);
		return STR(encodeURIComponent(v.value));
	}),	

	'Uri:decode_full': FN_NATIVE(([v]) => {
		assertString(v);
		return STR(decodeURI(v.value));
	}),
	
	'Uri:decode_component': FN_NATIVE(([v]) => {
		assertString(v);
		return STR(decodeURIComponent(v.value));
	}),
	//#endregion

	//#region Arr
	'Arr:create': FN_NATIVE(([length, initial]) => {
		assertNumber(length);
		try {
			return ARR(Array(length.value).fill(initial ?? NULL));
		} catch (e) {
			if (length.value < 0) throw new AiScriptRuntimeError('Arr:create expected non-negative number, got negative');
			if (!Number.isInteger(length.value)) throw new AiScriptRuntimeError('Arr:create expected integer, got non-integer');
			throw e;
		}
	}),
	//#endregion

	//#region Obj
	'Obj:keys': FN_NATIVE(([obj]) => {
		assertObject(obj);
		return ARR(Array.from(obj.value.keys()).map(k => STR(k)));
	}),

	'Obj:vals': FN_NATIVE(([obj]) => {
		assertObject(obj);
		return ARR(Array.from(obj.value.values()));
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

	'Obj:merge': FN_NATIVE(([a, b]) => {
		assertObject(a);
		assertObject(b);
		return OBJ(new Map([...a.value, ...b.value]));
	}),
	//#endregion
	
	//#region Error
	'Error:create': FN_NATIVE(([name, info]) => {
		assertString(name);
		return ERROR(name.value, info);
	}),
	//#endregion

	//#region Async
	'Async:interval': FN_NATIVE(async ([interval, callback, immediate], opts) => {
		assertNumber(interval);
		assertFunction(callback);
		if (immediate) {
			assertBoolean(immediate);
			if (immediate.value) opts.call(callback, []);
		}

		let id: ReturnType<typeof setInterval>;

		const start = (): void => {
			id = setInterval(() => {
				opts.topCall(callback, []);
			}, interval.value);
			opts.registerAbortHandler(stop);
			opts.registerPauseHandler(stop);
			opts.unregisterUnpauseHandler(start);
		};
		const stop = (): void => {
			clearInterval(id);
			opts.unregisterAbortHandler(stop);
			opts.unregisterPauseHandler(stop);
			opts.registerUnpauseHandler(start);
		};

		start();

		// stopper
		return FN_NATIVE(([], opts) => {
			stop();
			opts.unregisterUnpauseHandler(start);
		});
	}),

	'Async:timeout': FN_NATIVE(async ([delay, callback], opts) => {
		assertNumber(delay);
		assertFunction(callback);

		let id: ReturnType<typeof setInterval>;

		const start = (): void => {
			id = setTimeout(() => {
				opts.topCall(callback, []);
				opts.unregisterAbortHandler(stop);
				opts.unregisterPauseHandler(stop);
			}, delay.value);
			opts.registerAbortHandler(stop);
			opts.registerPauseHandler(stop);
			opts.unregisterUnpauseHandler(start);
		};
		const stop = (): void => {
			clearTimeout(id);
			opts.unregisterAbortHandler(stop);
			opts.unregisterPauseHandler(stop);
			opts.registerUnpauseHandler(start);
		};

		start();

		// stopper
		return FN_NATIVE(([], opts) => {
			stop();
			opts.unregisterUnpauseHandler(start);
		});
	}),
	//#endregion
};
