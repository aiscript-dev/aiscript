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

// ['識別子', 使用可否]
const identifierCases: [string, boolean][] = [

	// IdentifierStart
	//   UnicodeLetter
	//     Uppercase letter (Lu)
	['A', true], // U+0041 (LATIN CAPITAL LETTER A)
	['Ω', false], // U+03A9 (GREEK CAPITAL LETTER OMEGA)

	//     Lowercase letter (Ll)
	['a', true], // U+0061 (LATIN SMALL LETTER A )
	['β', false], // U+03B2 (GREEK SMALL LETTER BETA)

	//     Titlecase letter (Lt)
	['ǅ', false], // U+01C5 (LATIN CAPITAL LETTER D WITH SMALL LETTER Z WITH CARON)
	['ǈ', false], // U+01C8 (LATIN CAPITAL LETTER L WITH SMALL LETTER J)

	//     Modifier letter (Lm)
	['ʰ', false], // U+02B0 (Modifier Letter Small H)
	['々', false], // U+3005 (Ideographic Iteration Mark)

	//     Other letter (Lo)
	['あ', false], // U+3042 (HIRAGANA LETTER A)
	['藍', false], // U+85CD (CJK Unified Ideograph-85CD)
	['𠮷', false], // U+20BB7 (CJK Unified Ideograph-20BB7)

	//     Letter number (Nl)
	['ᛮ', false], // U+16EE (Runic Arlaug Symbol)
	['Ⅳ', false], // U+2163 (Roman Numeral Four)

	//   $
	['$', false],

	//   _
	['_', true],

	// IdentifierPart
	//   IdentifierStart
	['_A', true],
	['_Ω', false],
	['_a', true],
	['_β', false],
	['_ǅ', false],
	['_ǈ', false],
	['_ʰ', false],
	['_々', false],
	['_あ', false],
	['_藍', false],
	['_𠮷', false],
	['_ᛮ', false],
	['_Ⅳ', false],
	['_$', false],
	['__', true],

	//   UnicodeCombiningMark
	//     Non-spacing mark (Mn)
	['á', false], // U+0301 (Combining Acute Accent)

	//     Combining spacing mark (Mc)
	['राम', false], // U+093E (Devanagari Vowel Sign Aa)

	//   UnicodeDigit
	//     Decimal number (Nd)
	['a0', true], // U+0030 (Digit Zero)
	['a๑', false], // U+0E51 (Thai Digit One)

	//   UnicodeConnectorPunctuation
	//     Connector punctuation (Pc)
	['a‿b', false], // U+203F (Undertie)

	// <ZWNJ>
	['बि‌ना', false],

	// <ZWJ>
	['क‍्', false],

	['\\u', false],
	['\\u000x', false],
	['\\u0021', false], // "!": Other Punctuation (Po)
	['\\u0069\\u0066', false], // "if"
	['\\ud83e\\udd2f', false], // U+1F92F (Shocked Face with Exploding Head): Other Symbol (So)
	['\\uD83E\\uDD2F', false],
	['_\\u', false],
	['_\\u000x', false],
	['_\\u0021', false],
	['_\\ud83e\\udd2f', false],
	['_\\uD83E\\uDD2F', false],
];

const escapeIdentifiers: [string, string][] = [
	['\\u0041', 'A'],
	['\\u85cd', '藍'],
	['\\u85CD', '藍'],
	['\\ud842\\udfb7', '𠮷'],
	['\\uD842\\uDFB7', '𠮷'],
	['_\\u0041', '_A'],
	['_\\u85cd', '_藍'],
	['_\\u85CD', '_藍'],
	['_\\ud842\\udfb7', '_𠮷'],
	['_\\uD842\\uDFB7', '_𠮷'],
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

	break: [(definedName, referredName) =>
	`
	<: #label: eval {
		break #label eval {
			let ${definedName} = "ai"
			${referredName}
		}
	}
	`, STR('ai')],

	typeParam: [(definedName, referredName) =>
	`
	@f<${definedName}>(x): ${referredName} { x }
	`, NULL],

	innerType: [(definedName, referredName) =>
	`
	let x: arr<@<${definedName}>() => ${referredName}> = []
	`, NULL],

	returnType: [(definedName, referredName) =>
	`
	let x: @() => @<${definedName}>() => ${referredName} = @() {}
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

	// グローバルの expect を使用すると expect.hasAssertions() が失敗するときがあるので、
	// ローカルの expect を使用する
	test.concurrent.for(
		identifierCases
	)('%s is allowed: %s', async ([word, allowed], { expect }) => {
		expect.hasAssertions();
		if (allowed) {
			const res = await exe(sampleCode(word, word));
			eq(res, expected, expect);
		} else {
			expect(() => parser.parse(sampleCode(word, word))).toThrow(AiScriptSyntaxError);
			await Promise.resolve(); // https://github.com/vitest-dev/vitest/issues/4750
		}
	});

	test.concurrent.each(
		escapeIdentifiers
	)('escape sequence is not allowed: %s', async (word) => {
		expect(() => parser.parse(sampleCode(word, word))).toThrow(AiScriptSyntaxError);
	});
});

describe('identifier validation on obj key', () => {
	const codes: [string, (definedName: string, referredName: string) => string][] = [
		['literal', (definedName: string, referredName: string) => `
		let x = { ${definedName}: 1 }
		<: x["${referredName}"]
		`],

		['prop', (definedName: string, referredName: string) => `
		let x = {}
		x.${definedName} = 1
		<: x.${referredName}
		`],
	]

	describe.each(codes)('%s', (_, code) => {
		test.concurrent.each(
			reservedWords
		)('reserved word %s must be allowed', async (word) => {
			const res = await exe(code(word, word));
			eq(res, NUM(1));
		});

		test.concurrent.each(
			identifierCases
		)('%s is allowed: %s', async (word, allowed) => {
			expect.hasAssertions();
			if (allowed) {
				const res = await exe(code(word, word));
				eq(res, NUM(1));
			} else {
				expect(() => parser.parse(code(word, word))).toThrow(AiScriptSyntaxError);
				await Promise.resolve(); // https://github.com/vitest-dev/vitest/issues/4750
			}
		});
	});
});

describe('reserved word validation on string obj key', () => {
	const codes: [string, (definedName: string, referredName: string) => string][] = [
		['literal', (definedName: string, referredName: string) => `
		let x = { "${definedName}": 1 }
		<: x["${referredName}"]
		`],

		['prop', (definedName: string, referredName: string) => `
		let x = {}
		x."${definedName}" = 1
		<: x."${referredName}"
		`],
	]

	describe.each(codes)('%s', (_, code) => {
		test.concurrent.each(
			reservedWords
		)('reserved word %s must be allowed', async (word) => {
			const res = await exe(code(word, word));
			eq(res, NUM(1));
		});
	});
});

test.concurrent('Keyword cannot contain escape characters', async () => {
	await expect(async () => await exe(`
	\\u0069\\u0066 true {
		<: 1
	}
	`)).rejects.toThrow();
})
