import { describe, expect, test } from 'vitest';
import { AiSON } from '../src/parser/aison';

describe('parse', () => {
	test.concurrent('str', () => {
		expect(AiSON.parse('"Ai-chan kawaii"')).toEqual('Ai-chan kawaii');
	});

	test.concurrent('number', () => {
		expect(AiSON.parse('42')).toEqual(42);
	});

	test.concurrent('bool', () => {
		expect(AiSON.parse('true')).toEqual(true);
	});

	test.concurrent('null', () => {
		expect(AiSON.parse('null')).toEqual(null);
	});

	test.concurrent('array', () => {
		expect(AiSON.parse('[1, 2, 3]')).toEqual([1, 2, 3]);
	});

	test.concurrent('object', () => {
		expect(AiSON.parse('{key: "value"}')).toEqual({ key: 'value' });
	});

	test.concurrent('nested', () => {
		expect(AiSON.parse('[{key: "value"}]')).toEqual([{ key: 'value' }]);
	});

	test.concurrent('invalid: unclosed string', () => {
		expect(() => AiSON.parse('"hello')).toThrow();
	});

	test.concurrent('invalid: unclosed array', () => {
		expect(() => AiSON.parse('[1, 2, 3')).toThrow();
	});

	test.concurrent('not allowed: empty', () => {
		expect(() => AiSON.parse('')).toThrow();
	});

	test.concurrent('not allowed: function', () => {
		expect(() => AiSON.parse(`@greet() { return "hello" }

greet()`)).toThrow();
	});

	test.concurrent('not allowed: variable assignment', () => {
		expect(() => AiSON.parse('let x = 42')).toThrow();
	});

	test.concurrent('not allowed: namespace', () => {
		expect(() => AiSON.parse(`:: Ai {
	let x = 42
}`)).toThrow();
	});

	test.concurrent('not allowed: expression', () => {
		expect(() => AiSON.parse('{key: (3 + 5)}')).toThrow();
	});

	test.concurrent('not allowed: object shorthand', () => {
		expect(() => AiSON.parse('{key}')).toThrow();
	});

	test.concurrent('not allowed: labeled expression', () => {
		expect(() => AiSON.parse('#label: eval { 1 }')).toThrow();
	});

	test.concurrent('not allowed: multiple statements (string)', () => {
		expect(() => AiSON.parse(`"hello"

"hi"`)).toThrow();
	});

	test.concurrent('not allowed: multiple statements in the same line', () => {
		expect(() => AiSON.parse('"hello" "hi"')).toThrow();
	});

	test.concurrent('not allowed: multiple statements (object)', () => {
		expect(() => AiSON.parse(`{key: "value"}

{foo: "bar"}`)).toThrow();
	});
});

describe('stringify', () => {
	test.concurrent('str', () => {
		expect(AiSON.stringify('Ai-chan kawaii')).toEqual('"Ai-chan kawaii"');
	});

	test.concurrent('number', () => {
		expect(AiSON.stringify(42)).toEqual('42');
	});

	test.concurrent('bool', () => {
		expect(AiSON.stringify(true)).toEqual('true');
	});

	test.concurrent('null', () => {
		expect(AiSON.stringify(null)).toEqual('null');
	});

	test.concurrent('array', () => {
		expect(AiSON.stringify([1, 2, 3])).toEqual('[1, 2, 3]');
	});

	test.concurrent('object', () => {
		expect(AiSON.stringify({ key: 'value' })).toEqual('{key: "value"}');
	});

	test.concurrent('nested', () => {
		expect(AiSON.stringify([{ key: 'value' }])).toEqual('[{key: "value"}]');
	});

	test.concurrent('pretty print: array', () => {
		expect(AiSON.stringify([1, 2, 3], null, 2)).toEqual(`[
  1,
  2,
  3
]`);
	});

	test.concurrent('pretty print: object', () => {
		expect(AiSON.stringify({ key: 'value', foo: 'bar' }, null, 2)).toEqual(`{
  key: "value",
  foo: "bar"
}`);
	});

	test.concurrent('pretty print: nested', () => {
		expect(AiSON.stringify({ arr: [1, 2, { key: 'value' }] }, null, 2)).toEqual(`{
  arr: [
    1,
    2,
    {
      key: "value"
    }
  ]
}`);
	});
	
	test.concurrent('custom indent', () => {
		expect(AiSON.stringify({ key: 'value', foo: 'bar' }, null, '\t')).toEqual(`{
\tkey: "value",
\tfoo: "bar"
}`);
	});
	
	test.concurrent('no indent when indent is 0', () => {
		expect(AiSON.stringify({ key: 'value', foo: 'bar' }, null, 0)).toEqual('{key: "value", foo: "bar"}');
	});

	test.concurrent('can parse generated aison', () => {
		const obj = { arr: [1, 2, { key: 'value' }] };
		const aison = AiSON.stringify(obj);
		const parsed = AiSON.parse(aison);
		expect(parsed).toStrictEqual(obj);
	});
});
