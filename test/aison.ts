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
