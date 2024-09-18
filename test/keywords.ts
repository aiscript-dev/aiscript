import { describe, expect, test } from 'vitest';
import { Parser, Interpreter } from '../src';
import { AiScriptSyntaxError } from '../src/error';
import { exe } from './testutils';

const reservedWords = [
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
] as const;

const sampleCodes = Object.entries({
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
});

function pickRandom<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

describe.each(
	sampleCodes
)('reserved word validation on %s', (_, sampleCode) => {

	test.concurrent.each(
		[pickRandom(reservedWords)]
	)('%s must be rejected', (word) => {
		return expect(exe(sampleCode(word))).rejects.toThrow(AiScriptSyntaxError);
	});

	test.concurrent.each(
		[pickRandom(reservedWords)]
	)('%scat must be allowed', (word) => {
		return exe(sampleCode(word+'cat'));
	});

});
