import { v4 as uuid } from 'uuid';
import { Value, NUM, STR, FN_NATIVE, FALSE, TRUE, VArr, ARR } from '../value';
import { assertNumber, assertString, assertArray } from '../util';
import { AiScriptError } from '../error';

export const std: Record<string, Value> = {
	'Util:uuid': FN_NATIVE(() => {
		return STR(uuid());
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
