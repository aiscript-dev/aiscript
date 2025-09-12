import { describe, expect, test } from 'vitest';
import { Parser } from '../src';
import { AiScriptSyntaxError } from '../src/error';
import { eq, exe } from './testutils';
import { NULL, NUM, STR, Value } from '../src/interpreter/value';

const reservedWords = [
	// 使用中の語
	'null',
	'true',
	'false',
	'each',
	'for',
	'do',
	'while',
	'loop',
	'break',
	'continue',
	'match',
	'case',
	'default',
	'if',
	'elif',
	'else',
	'return',
	'eval',
	'var',
	'let',
	'exists',

	// 使用予定の語
	// 文脈キーワードは識別子に利用できるため除外
	'as',
	'async',
	'attr',
	'attribute',
	'await',
	'catch',
	'class',
	// 'const',
	'component',
	'constructor',
	// 'def',
	'dictionary',
	'enum',
	'export',
	'finally',
	'fn',
	// 'func',
	// 'function',
	'hash',
	'in',
	'interface',
	'out',
	'private',
	'public',
	'ref',
	'static',
	'struct',
	'table',
	'this',
	'throw',
	'trait',
	'try',
	'undefined',
	'use',
	'using',
	'when',
	'yield',
	'import',
	'is',
	'meta',
	'module',
	'namespace',
	'new',
] as const;

const validIdentifiers = [
	// IdentifierStart
	//   UnicodeLetter
	//     Uppercase letter (Lu)
	'A', // U+0041 (LATIN CAPITAL LETTER A)
	'Ω', // U+03A9 (GREEK CAPITAL LETTER OMEGA)

	//     Lowercase letter (Ll)
	'a', // U+0061 (LATIN SMALL LETTER A )
	'β', // U+03B2 (GREEK SMALL LETTER BETA)

	//     Titlecase letter (Lt)
	'ǅ', // U+01C5 (LATIN CAPITAL LETTER D WITH SMALL LETTER Z WITH CARON)
	'ǈ', // U+01C8 (LATIN CAPITAL LETTER L WITH SMALL LETTER J)

	//     Modifier letter (Lm)
	'ʰ', // U+02B0 (Modifier Letter Small H)
	'々', // U+3005 (Ideographic Iteration Mark)

	//     Other letter (Lo)
	'あ', // U+3042 (HIRAGANA LETTER A)
	'藍', // U+85CD (CJK Unified Ideograph-85CD)
	'𠮷', // U+20BB7 (CJK Unified Ideograph-20BB7)

	//     Letter number (Nl)
	'ᛮ', // U+16EE (Runic Arlaug Symbol)
	'Ⅳ', // U+2163 (Roman Numeral Four)

	//   $
	'$',

	//   _
	'_',

	// IdentifierPart
	//   IdentifierStart
	'_A',
	'_Ω',
	'_a',
	'_β',
	'_ǅ',
	'_ǈ',
	'_ʰ',
	'_々',
	'_あ',
	'_藍',
	'_𠮷',
	'_ᛮ',
	'_Ⅳ',
	'_$',
	'__',

	//   UnicodeCombiningMark
	//     Non-spacing mark (Mn)
	'á', // U+0301 (Combining Acute Accent)

	//     Combining spacing mark (Mc)
	'राम', // U+093E (Devanagari Vowel Sign Aa)

	//   UnicodeDigit
	//     Decimal number (Nd)
	'a0', // U+0030 (Digit Zero)

	//   UnicodeConnectorPunctuation
	//     Connector punctuation (Pc)
	'a‿b', // U+203F (Undertie)

	// <ZWNJ>
	'बि‌ना',

	// <ZWJ>
	'क‍्',
];

const validEscapeIdentifiers: [string, string][] = [
	['\\u85cd', '藍'],
	['\\u85CD', '藍'],
	['\\ud842\\udfb7', '𠮷'],
	['\\uD842\\uDFB7', '𠮷'],
	['_\\u85cd', '_藍'],
	['_\\u85CD', '_藍'],
	['_\\ud842\\udfb7', '_𠮷'],
	['_\\uD842\\uDFB7', '_𠮷'],
];

const invalidIdentifiers = [
	'\\u',
	'\\u000x',
	'\\u0021', // "!": Other Punctuation (Po)
	'\\u0069\\u0066', // "if"
	'\\ud83e\\udd2f', '\\uD83E\\uDD2F', // U+1F92F (Shocked Face with Exploding Head): Other Symbol (So)
	'_\\u',
	'_\\u000x',
	'_\\u0021',
	'_\\ud83e\\udd2f',
	'_\\uD83E\\uDD2F',
];

const sampleCodes = Object.entries<[(definedName: string, referredName: string) => string, Value]>({
	variable: [(definedName, referredName) =>
	`
	let ${definedName} = "ai"
	<: ${referredName}
	`, STR("ai")],

	function: [(definedName, referredName) =>
	`
	@${definedName}() { 'ai' }
	<: ${referredName}()
	`, STR("ai")],

	attribute: [(definedName) =>
	`
	#[${definedName} 1]
	@f() { 1 }
	`, NULL],

	namespace: [(definedName, referredName) =>
	`
	:: ${definedName} {
		@f() { 1 }
	}
	<: ${referredName}:f()
	`, NUM(1)],

	prop: [(definedName, referredName) =>
	`
	let x = { ${definedName}: 1 }
	x.${referredName}
	`, NUM(1)],

	meta: [(definedName) =>
	`
	### ${definedName} 1
	`, NULL],

	forBreak: [(definedName, referredName) =>
	`
	#${definedName}: for 1 {
		break #${referredName}
	}
	`, NULL],

	eachBreak: [(definedName, referredName) =>
	`
	#${definedName}: each let v, [0] {
		break #${referredName}
	}
	`, NULL],

	whileBreak: [(definedName, referredName) =>
	`
	#${definedName}: while false {
		break #${referredName}
	}
	`, NULL],

	forContinue: [(definedName, referredName) =>
	`
	#${definedName}: for 1 {
		continue #${referredName}
	}
	`, NULL],

	eachContinue: [(definedName, referredName) =>
	`
	#${definedName}: each let v, [0] {
		break #${referredName}
	}
	`, NULL],

	whileContinue: [(definedName, referredName) =>
	`
	var flag = true
	#${definedName}: while flag {
		flag = false
		continue #${referredName}
	}
	`, NULL],

	typeParam: [(definedName, referredName) =>
	`
	@f<${definedName}>(x): ${referredName} { x }
	`, NULL],
});

const parser = new Parser();

describe.each(
	sampleCodes
)('identifier validation on %s', (_, [sampleCode, expected]) => {

	test.concurrent.each(
		reservedWords
	)('%s must be rejected', (word) => {
		expect(() => parser.parse(sampleCode(word, word))).toThrow(AiScriptSyntaxError);
	});

	test.concurrent.each(
		reservedWords
	)('%scat must be allowed', (word) => {
		const wordCat = word + 'cat';
		parser.parse(sampleCode(wordCat, wordCat));
	});

	test.concurrent.each(
		validIdentifiers
	)('%s must be allowed', (word) => {
		parser.parse(sampleCode(word, word));
	});

	test.concurrent.each(
		validEscapeIdentifiers
	)('$0 must be allowed (referred as $1)', (encoded, decoded) => {
		parser.parse(sampleCode(encoded, decoded));
	});

	test.concurrent.each(
		validEscapeIdentifiers
	)('$1 must be allowed (referred as $0)', async (encoded, decoded) => {
		const res = await exe(sampleCode(decoded, encoded));
		eq(res, expected);
	});

	test.concurrent.each(
		invalidIdentifiers
	)('%s must be rejected', (word) => {
		expect(() => parser.parse(sampleCode(word, word))).toThrow(AiScriptSyntaxError);
	});
});

test.concurrent('Keyword cannot contain escape characters', async () => {
	await expect(async () => await exe(`
	\\u0069\\u0066 true {
		<: 1
	}
	`)).rejects.toThrow();
})
