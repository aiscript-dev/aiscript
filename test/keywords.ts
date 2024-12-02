import { describe, expect, test } from 'vitest';
import { Parser } from '../src';
import { AiScriptSyntaxError } from '../src/error';

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

const sampleCodes = Object.entries<(word: string) => string>({
	variable: word =>
	`
	let ${word} = "ai"
	${word}
	`,

	function: word =>
	`
	@${word}() { 'ai' }
	${word}()
	`,

	attribute: word =>
	`
	#[${word} 1]
	@f() { 1 }
	`,

	namespace: word =>
	`
	:: ${word} {
		@f() { 1 }
	}
	${word}:f()
	`,

	prop: word =>
	`
	let x = { ${word}: 1 }
	x.${word}
	`,

	meta: word =>
	`
	### ${word} 1
	`,

	typeParam: word =>
	`
	@f<${word}>(x): ${word} { x }
	`,
});

const parser = new Parser();

describe.each(
	sampleCodes
)('reserved word validation on %s', (_, sampleCode) => {

	test.concurrent.each(
		reservedWords
	)('%s must be rejected', (word) => {
		expect(() => parser.parse(sampleCode(word))).toThrow(AiScriptSyntaxError);
	});

	test.concurrent.each(
		reservedWords
	)('%scat must be allowed', (word) => {
		parser.parse(sampleCode(word+'cat'));
	});

});
