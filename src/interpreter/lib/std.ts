const pkg = require('../../../package.json');
import { v4 as uuid } from 'uuid';
import { Value, NUM, STR, FN_NATIVE, FALSE, TRUE, VArr, ARR, NULL } from '../value';
import { assertNumber, assertString, assertArray, assertBoolean, valToJs, jsToVal } from '../util';
import { AiScriptError } from '../error';

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
	'Core:type': FN_NATIVE(([a]) => {
		return STR(a.type);
	}),
	'Core:len': FN_NATIVE(([a]) => {
		if (a.type !== 'arr' && a.type !== 'str') return NUM(0);
		return NUM(a.value.length);
	}),
	'Core:to_str': FN_NATIVE(([a]) => {
		if (a.type === 'str') return a;
		if (a.type === 'num') return STR(a.value.toString());
		return STR('?');
	}),
	'Core:to_num': FN_NATIVE(([a]) => {
		if (a.type === 'num') return a;
		if (a.type === 'str') {
			const parsed = parseInt(a.value, 10);
			if (isNaN(parsed)) return NULL;
			return NUM(parsed);
		}
		return NULL;
	}),
	'Util:uuid': FN_NATIVE(() => {
		return STR(uuid());
	}),
	'Json:stringify': FN_NATIVE(([a]) => {
		return STR(JSON.stringify(valToJs(a)));
	}),
	'Json:parse': FN_NATIVE(([a]) => {
		assertString(a);
		return jsToVal(JSON.parse(a.value));
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
		const res = Math.sqrt(a.value);
		if (isNaN(res)) throw new AiScriptError('Invalid operation.');
		return NUM(res);
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
	'Str:includes': FN_NATIVE(([a, b]) => {
		assertString(a);
		assertString(b);
		return a.value.includes(b.value) ? TRUE : FALSE;
	}),
	'Str:split': FN_NATIVE(([a, b]) => {
		assertString(a);
		if (b) assertString(b);
		return ARR(a.value.split(b ? b.value : '').map(s => STR(s)));
	}),
	'Arr:push': FN_NATIVE(([a, b]) => {
		assertArray(a);
		return ARR([...a.value, b]);
	}),
	'Arr:unshift': FN_NATIVE(([a, b]) => {
		assertArray(a);
		return ARR([b, ...a.value]);
	}),
	'Arr:pop': FN_NATIVE(([a]) => {
		assertArray(a);
		return ARR(a.value.slice(0, a.value.length - 1));
	}),
	'Arr:shift': FN_NATIVE(([a]) => {
		assertArray(a);
		return ARR(a.value.slice(1, a.value.length));
	}),
	'Arr:concat': FN_NATIVE(([a, b]) => {
		assertArray(a);
		assertArray(b);
		return ARR(a.value.concat(b.value));
	}),
	'Arr:join': FN_NATIVE(([a, b]) => {
		assertArray(a);
		if (b) assertString(b);
		return STR(a.value.map(i => i.type === 'str' ? i.value : '').join(b ? b.value : ''));
	}),
	'Arr:includes': FN_NATIVE(([a, b]) => {
		assertArray(a);
		if (b.type !== 'str' && b.type !== 'num' && b.type !== 'bool' && b.type !== 'null') return FALSE;
		const getValue = (v: VArr) => {
			return v.value.map(i => {
				if (i.type === 'str') return i.value;
				if (i.type === 'num') return i.value;
				if (i.type === 'bool') return i.value;
				if (i.type === 'null') return null;
				return Symbol();
			});
		};
		return getValue(a).includes(b.type === 'null' ? null : b.value) ? TRUE : FALSE;
	}),
};
