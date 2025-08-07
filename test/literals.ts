import * as assert from 'assert';
import { describe, test } from 'vitest';
import { } from '../src';
import { NUM, STR, NULL, ARR, OBJ, BOOL, TRUE, FALSE, ERROR ,FN_NATIVE } from '../src/interpreter/value';
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

	test.concurrent('number (Float with integer zero omitted)', async () => {
		const res = await exe(`
		<: .5
		`);
		eq(res, NUM(0.5));
	});

	test.concurrent('number (Float with decimal zero omitted)', async () => {
		const res = await exe(`
		<: 5.
		`);
		eq(res, NUM(5));
	});

	test.concurrent('arr (separated by comma)', async () => {
		const res = await exe(`
		<: [1, 2, 3]
		`);
		eq(res, ARR([NUM(1), NUM(2), NUM(3)]));
	});

	test.concurrent('arr (separated by comma) (with trailing comma)', async () => {
		const res = await exe(`
		<: [1, 2, 3,]
		`);
		eq(res, ARR([NUM(1), NUM(2), NUM(3)]));
	});

	test.concurrent('arr (separated by line break)', async () => {
		const res = await exe(`
		<: [
			1
			2
			3
		]
		`);
		eq(res, ARR([NUM(1), NUM(2), NUM(3)]));
	});

	test.concurrent('arr (separated by line break and comma)', async () => {
		const res = await exe(`
		<: [
			1,
			2,
			3
		]
		`);
		eq(res, ARR([NUM(1), NUM(2), NUM(3)]));
	});

	test.concurrent('arr (separated by line break and comma) (with trailing comma)', async () => {
		const res = await exe(`
		<: [
			1,
			2,
			3,
		]
		`);
		eq(res, ARR([NUM(1), NUM(2), NUM(3)]));
	});

	test.concurrent('obj (separated by comma)', async () => {
		const res = await exe(`
		<: { a: 1, b: 2, c: 3 }
		`);
		eq(res, OBJ(new Map([['a', NUM(1)], ['b', NUM(2)], ['c', NUM(3)]])));
	});

	test.concurrent('obj (separated by comma) (with trailing comma)', async () => {
		const res = await exe(`
		<: { a: 1, b: 2, c: 3, }
		`);
		eq(res, OBJ(new Map([['a', NUM(1)], ['b', NUM(2)], ['c', NUM(3)]])));
	});

	test.concurrent('obj (separated by line break)', async () => {
		const res = await exe(`
		<: {
			a: 1
			b: 2
			c: 3
		}
		`);
		eq(res, OBJ(new Map([['a', NUM(1)], ['b', NUM(2)], ['c', NUM(3)]])));
	});

	test.concurrent('obj (string key)', async () => {
		const res = await exe(`
		<: {
			"藍": 42,
		}
		`);
		eq(res, OBJ(new Map([['藍', NUM(42)]])));
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

	test.concurrent('nested brackets', async () => {
		const res = await exe(`
		<: \`{if true {1} else {2}}\`
		`);
		eq(res, STR('1'));
	});

	test.concurrent('new line before', async () => {
		const res = await exe(`
		<: \`{"Hello"
		// comment
		}\`
		`);
		eq(res, STR('Hello'));
	});

	test.concurrent('new line after', async () => {
		const res = await exe(`
		<: \`{
		// comment
		"Hello"}\`
		`);
		eq(res, STR('Hello'));
	});
});

