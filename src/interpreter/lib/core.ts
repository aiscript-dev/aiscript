const pkg = require('../../../package.json');
import { Value, FALSE, TRUE, NUM, FN_NATIVE, STR, NULL, VStr, VArr, ARR } from '../value';
import { assertNumber, assertBoolean, assertString, assertArray } from '../util';
import { AiScriptError } from '../error';

export const core: Record<string, Value> = {
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
};
