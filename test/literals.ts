import * as assert from 'assert';
import { expect, test } from '@jest/globals';
import { } from '../src';
import { NUM, STR, NULL, ARR, OBJ, DIC, BOOL, TRUE, FALSE, ERROR ,FN_NATIVE } from '../src/interpreter/value';
import { } from '../src/error';
import { exe, eq } from './testutils';

describe('literal', () => {
	test.concurrent('string (single quote)', async () => {
		const res = await exe(`
		<: 'foo'
		`);
		eq(res, STR('foo'));
	});

	test.concurrent('string (double quote)', async () => {
		const res = await exe(`
		<: "foo"
		`);
		eq(res, STR('foo'));
	});

	test.concurrent('Escaped double quote', async () => {
		const res = await exe('<: "ai saw a note \\"bebeyo\\"."');
		eq(res, STR('ai saw a note "bebeyo".'));
	});

	test.concurrent('Escaped single quote', async () => {
		const res = await exe('<: \'ai saw a note \\\'bebeyo\\\'.\'');
		eq(res, STR('ai saw a note \'bebeyo\'.'));
	});

	test.concurrent('bool (true)', async () => {
		const res = await exe(`
		<: true
		`);
		eq(res, BOOL(true));
	});

	test.concurrent('bool (false)', async () => {
		const res = await exe(`
		<: false
		`);
		eq(res, BOOL(false));
	});

	test.concurrent('number (Int)', async () => {
		const res = await exe(`
		<: 10
		`);
		eq(res, NUM(10));
	});

	test.concurrent('number (Float)', async () => {
		const res = await exe(`
		<: 0.5
		`);
		eq(res, NUM(0.5));
	});

	describe.each([[
		'arr',
		(cm, tcm, lb) => `<: [${lb}1${cm}${lb}2${cm}${lb}3${tcm}${lb}]`,
		ARR([NUM(1), NUM(2), NUM(3)]),
	], [
		'obj',
		(cm, tcm, lb) => `<: {${lb}a: 1${cm}${lb}b: 2${cm}${lb}c: 3${tcm}${lb}}`,
		OBJ(new Map([['a', NUM(1)], ['b', NUM(2)], ['c', NUM(3)]])),
	], [
		'dic',
		(cm, tcm, lb) => `<: dic {${lb}[null]: 1${cm}${lb}[2]: 2${cm}${lb}["c"]: 3${tcm}${lb}}`,
		DIC.fromEntries([[NULL, NUM(1)], [NUM(2), NUM(2)], [STR('c'), NUM(3)]]),
	]])('%s', (_, script, result) => {
		test.concurrent.each([[
			'separated by comma',
			[', ', '', ''],
		], [
			'separated by comma, with trailing comma',
			[', ', ',', ''],
		], [
			'separated by line break',
			['', '', '\n'],
		], [
			'separated by line break and comma',
			[',', '', '\n'],
		], [
			'separated by line break and comma, with trailing comma',
			[',', ',', '\n'],
		]])('%s', async (_, [cm, tcm, lb]) => {
			eq(
				result,
				await exe(script(cm, tcm, lb)),
			);
		});
	});
	test.concurrent('obj and arr (separated by line break)', async () => {
		const res = await exe(`
		<: {
			a: 1
			b: [
				1
				2
				3
			]
			c: 3
		}
		`);
		eq(res, OBJ(new Map<string, any>([
			['a', NUM(1)],
			['b', ARR([NUM(1), NUM(2), NUM(3)])],
			['c', NUM(3)]
		])));
	});
});

describe('Template syntax', () => {
	test.concurrent('Basic', async () => {
		const res = await exe(`
		let str = "kawaii"
		<: \`Ai is {str}!\`
		`);
		eq(res, STR('Ai is kawaii!'));
	});

	test.concurrent('convert to str', async () => {
		const res = await exe(`
		<: \`1 + 1 = {(1 + 1)}\`
		`);
		eq(res, STR('1 + 1 = 2'));
	});

	test.concurrent('invalid', async () => {
		try {
			await exe(`
			<: \`{hoge}\`
			`);
		} catch (e) {
			assert.ok(true);
			return;
		}
		assert.fail();
	});

	test.concurrent('Escape', async () => {
		const res = await exe(`
		let message = "Hello"
		<: \`\\\`a\\{b\\}c\\\`\`
		`);
		eq(res, STR('`a{b}c`'));
	});
});

