import { decodeUnicodeEscapeSequence, isHighSurrogate, isLowSurrogate, isSurrogatePair } from '../src/utils/characters';
import { describe, expect, test } from 'vitest';

describe('isHighSurrogate', () => {
	const cases: [string, boolean][] = [
		['', false],
		['\ud7ff', false],
		['\ud800', true],
		['\udbff', true],
		['\udc00', false],
		['\udfff', false],
		['\ue000', false],
	];

	test.concurrent.each(cases)('"%s" -> %s', (input, expected) => {
		expect(isHighSurrogate(input)).toBe(expected);
	});

	test.concurrent('index out of range', () => {
		expect(isHighSurrogate('\uD800', 1)).toBe(false);
	});
});

describe('isLowSurrogate', () => {
	const cases: [string, boolean][] = [
		['', false],
		['\ud7ff', false],
		['\ud800', false],
		['\udbff', false],
		['\udc00', true],
		['\udfff', true],
		['\ue000', false],
	];

	test.concurrent.each(cases)('"%s" -> %s', (input, expected) => {
		expect(isLowSurrogate(input)).toBe(expected);
	});

	test.concurrent('index out of range', () => {
		expect(isLowSurrogate('\DC00', 1)).toBe(false);
	});
});

describe('isSurrogatePair', () => {
	const cases: [string, boolean][] = [
		['\ud842\udfb7', true],
		['\ud83e\udd2f', true],
		['a', false],
		['\u85cd', false],
		['\ud842', false],
		['\ud8000', false],
		['0\udc00', false],
		['_\ud842\udfb7', false],
	];

	test.concurrent.each(cases)('"%s" -> %s', (input, expected) => {
		expect(isSurrogatePair(input)).toBe(expected);
	});

	test.concurrent.each(cases)('start given', () => {
		expect(isSurrogatePair('_\ud842\udfb7', 1)).toBe(true);
	});
});

describe('decodeUnicodeEscapeSequence', () => {
	test('plain', () => {
		expect(decodeUnicodeEscapeSequence('abc123')).toBe('abc123');
	});

	test('escape', () => {
		expect(decodeUnicodeEscapeSequence('\\u0041')).toBe('A');
	});

	test('escape lowercase', () => {
		expect(decodeUnicodeEscapeSequence('\\u85cd')).toBe('藍');
	});

	test('escape uppercase', () => {
		expect(decodeUnicodeEscapeSequence('\\u85CD')).toBe('藍');
	});

	test('expects "u", unexpected end', () => {
		expect(() => decodeUnicodeEscapeSequence('\\')).toThrow();
	});

	test('expects "u"', () => {
		expect(() => decodeUnicodeEscapeSequence('\\0')).toThrow();
	});

	test('expects digit, unexpected end', () => {
		expect(() => decodeUnicodeEscapeSequence('\\u00')).toThrow();
	});

	test('expects digit', () => {
		expect(() => decodeUnicodeEscapeSequence('\\ug')).toThrow();
	});
});
