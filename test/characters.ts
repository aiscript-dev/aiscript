import { decodeUnicodeEscapeSequence, isHighSurrogate, isIdentifierPart, isIdentifierStart, isLowSurrogate, isSurrogatePair } from '../src/utils/characters';
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

describe('isIdentifierStart', () => {
	const cases: [string, boolean][] = [
		// UnicodeLetter
		['\u0041', true], // U+0041 (LATIN CAPITAL LETTER A): Uppercase letter (Lu)
		['\u0061', true], // U+0061 (LATIN SMALL LETTER A ): Lowercase letter (Ll)
		['\u01c5', true], // U+01C5 (LATIN CAPITAL LETTER D WITH SMALL LETTER Z WITH CARON): Titlecase letter (Lt)
		['\u01c8', true], // U+01C8 (LATIN CAPITAL LETTER L WITH SMALL LETTER J): Titlecase letter (Lt)
		['\u02b0', true], // U+02B0 (Modifier Letter Small H): Modifier letter (Lm)
		['\u03a9', true], // U+03A9 (GREEK CAPITAL LETTER OMEGA): Uppercase letter (Lu)
		['\u03b2', true], // U+03B2 (GREEK SMALL LETTER BETA): Lowercase letter (Ll)
		['\u16ee', true], // U+16EE (Runic Arlaug Symbol): Letter number (Nl)
		['\u2163', true], // U+2163 (Roman Numeral Four): Letter number (Nl)
		['\u3005', true], // U+3005 (Ideographic Iteration Mark): Modifier letter (Lm)
		['\u3042', true], // U+3042 (HIRAGANA LETTER A): Other letter (Lo)
		['\u85cd', true], // U+85CD (CJK Unified Ideograph-85CD): Other letter (Lo)
		['\ud842\udfb7', true], // U+20BB7 (CJK Unified Ideograph-20BB7): Other letter (Lo)

		// $
		['$', true],

		// _
		['_', true],

		// Invalid characters
		['\u0021', false], // U+0021 (Exclamation Mark): Other Punctuation (Po)
		['\u0030', false], // U+0030 (Digit Zero): Decimal number (Nd)
		['\u0301', false], // U+0301 (Combining Acute Accent): Non-spacing mark (Mn)
		['\u093e', false], // U+093E (Devanagari Vowel Sign Aa): Combining spacing mark (Mc)
		['\u200c', false], // U+200C (Zero Width Non-Joiner (ZWNJ)): Format (Cf)
		['\u200d', false], // U+200D (Zero Width Joiner (ZWJ)): Format (Cf)
		['\u203f', false], // U+203F (Undertie): Connector punctuation (Pc)
		['\ud83e\udd2f', false], // U+1F92F (Shocked Face with Exploding Head): Other Symbol (So)
	];

	test.concurrent.each(cases)('"%s" -> %s', (input, expected) => {
		expect(isIdentifierStart(input)).toBe(expected);
	});
});

describe('isIdentifierPart', () => {
	const cases: [string, boolean][] = [
		// UnicodeLetter
		['\u0041', true], // U+0041 (LATIN CAPITAL LETTER A): Uppercase letter (Lu)
		['\u0061', true], // U+0061 (LATIN SMALL LETTER A ): Lowercase letter (Ll)
		['\u01c5', true], // U+01C5 (LATIN CAPITAL LETTER D WITH SMALL LETTER Z WITH CARON): Titlecase letter (Lt)
		['\u01c8', true], // U+01C8 (LATIN CAPITAL LETTER L WITH SMALL LETTER J): Titlecase letter (Lt)
		['\u02b0', true], // U+02B0 (Modifier Letter Small H): Modifier letter (Lm)
		['\u03a9', true], // U+03A9 (GREEK CAPITAL LETTER OMEGA): Uppercase letter (Lu)
		['\u03b2', true], // U+03B2 (GREEK SMALL LETTER BETA): Lowercase letter (Ll)
		['\u16ee', true], // U+16EE (Runic Arlaug Symbol): Letter number (Nl)
		['\u2163', true], // U+2163 (Roman Numeral Four): Letter number (Nl)
		['\u3005', true], // U+3005 (Ideographic Iteration Mark): Modifier letter (Lm)
		['\u3042', true], // U+3042 (HIRAGANA LETTER A): Other letter (Lo)
		['\u85cd', true], // U+85CD (CJK Unified Ideograph-85CD): Other letter (Lo)
		['\ud842\udfb7', true], // U+20BB7 (CJK Unified Ideograph-20BB7): Other letter (Lo)

		// $
		['$', true],

		// _
		['_', true],

		// UnicodeCombiningMark
		['\u0301', true], // U+0301 (Combining Acute Accent): Non-spacing mark (Mn)
		['\u093e', true], // U+093E (Devanagari Vowel Sign Aa): Combining spacing mark (Mc)

		// UnicodeDigit
		//   Decimal number (Nd)
		['\u0030', true], // U+0030 (Digit Zero): Decimal number (Nd)

		// UnicodeConnectorPunctuation
		//   Connector punctuation (Pc)
		['\u203f', true], // U+203F (Undertie): Connector punctuation (Pc)

		// ZWNJ
		['\u200c', true], // U+200C (Zero Width Non-Joiner (ZWNJ)): Format (Cf)

		// ZWJ
		['\u200d', true], // U+200D (Zero Width Joiner (ZWJ)): Format (Cf)

		// Invalid characters
		['\u0021', false], // U+0021 (Exclamation Mark): Other Punctuation (Po)
		['\ud83e\udd2f', false], // U+1F92F (Shocked Face with Exploding Head): Other Symbol (So)
	];

	test.concurrent.each(cases)('"%s" -> %s', (input, expected) => {
		expect(isIdentifierPart(input)).toBe(expected);
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
