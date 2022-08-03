import * as assert from 'assert';
import { Parser } from '../src';
import { N_DEF, N_FALSE, N_NULL, N_NUM, N_STR, N_TMPL, N_TRUE } from '../src/parser/util';

function parse(program: string) {
	const parser = new Parser();
	return parser.parse(program);
}

it('comment line', async () => {
	const res = parse('// abc');
	assert.deepStrictEqual(res, []);
});

describe('varDef (let)', () => {
	it('string', async () => {
		const res = parse(`
		let abc = "xyz"
		`);
		assert.deepStrictEqual(res, [
			N_DEF('abc', undefined, N_STR('xyz'), false, []),
		]);
	});

	it('template', async () => {
		const res = parse(`
		let abc = \`abc{"123"}\`
		`);
		assert.deepStrictEqual(res, [
			N_DEF('abc', undefined, N_TMPL(['abc', N_STR('123')]), false, []),
		]);
	});

	it('number', async () => {
		const res = parse(`
		let abc = 100
		`);
		assert.deepStrictEqual(res, [
			N_DEF('abc', undefined, N_NUM(100), false, []),
		]);
	});

	it('boolean', async () => {
		let res;
		res = parse(`
		let abc = true
		`);
		assert.deepStrictEqual(res, [
			N_DEF('abc', undefined, N_TRUE(), false, []),
		]);

		res = parse(`
		let abc = false
		`);
		assert.deepStrictEqual(res, [
			N_DEF('abc', undefined, N_FALSE(), false, []),
		]);
	});

	it('null', async () => {
		const res = parse(`
		let abc = null
		`);
		assert.deepStrictEqual(res, [
			N_DEF('abc', undefined, N_NULL(), false, []),
		]);
	});
});

describe('varDef (var)', () => {
	it('string', async () => {
		const res = parse(`
		var abc = "xyz"
		`);
		assert.deepStrictEqual(res, [
			N_DEF('abc', undefined, N_STR('xyz'), true, []),
		]);
	});

	it('template', async () => {
		const res = parse(`
		var abc = \`abc{"123"}\`
		`);
		assert.deepStrictEqual(res, [
			N_DEF('abc', undefined, N_TMPL(['abc', N_STR('123')]), true, []),
		]);
	});

	it('number', async () => {
		const res = parse(`
		var abc = 100
		`);
		assert.deepStrictEqual(res, [
			N_DEF('abc', undefined, N_NUM(100), true, []),
		]);
	});

	it('boolean', async () => {
		let res;
		res = parse(`
		var abc = true
		`);
		assert.deepStrictEqual(res, [
			N_DEF('abc', undefined, N_TRUE(), true, []),
		]);

		res = parse(`
		var abc = false
		`);
		assert.deepStrictEqual(res, [
			N_DEF('abc', undefined, N_FALSE(), true, []),
		]);
	});

	it('null', async () => {
		const res = parse(`
		var abc = null
		`);
		assert.deepStrictEqual(res, [
			N_DEF('abc', undefined, N_NULL(), true, []),
		]);
	});
});
