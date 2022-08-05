import * as assert from 'assert';
import { Parser } from '../src';
import * as Ast from '../src/node';

function parse(program: string) {
	const parser = new Parser();
	return parser.parse(program);
}

it('comment line', () => {
	const res = parse('// abc');
	assert.deepStrictEqual(res, []);
});

describe('statements', () => {
	describe('varDef', () => {
		it('let', () => {
			const res = parse(`
			let abc = "xyz"
			`);
			assert.deepStrictEqual(res, [
				Ast.DEF('abc', Ast.STR('xyz'), false, { varType: undefined, attr: [] }),
			]);
		});

		it('var', () => {
			const res = parse(`
			var abc = "xyz"
			`);
			assert.deepStrictEqual(res, [
				Ast.DEF('abc', Ast.STR('xyz'), true, { varType: undefined, attr: [] }),
			]);
		});
	});

	it('out', () => {
		const res = parse(`
		<: "xyz"
		`);
		assert.deepStrictEqual(res, [
			Ast.CALL('print', [
				Ast.STR('xyz'),
			]),
		]);
	});
});

describe('expressions', () => {
	it('string', () => {
		const res = parse(`
		let x = "xyz"
		`);
		assert.deepStrictEqual(res, [
			Ast.DEF('x', Ast.STR('xyz'), false),
		]);
	});

	it('template', () => {
		const res = parse(`
		let x = \`abc{"123"}\`
		`);
		assert.deepStrictEqual(res, [
			Ast.DEF('x', Ast.TMPL(['abc', Ast.STR('123')]), false),
		]);
	});

	it('number', () => {
		const res = parse(`
		let x = 100
		`);
		assert.deepStrictEqual(res, [
			Ast.DEF('x', Ast.NUM(100), false),
		]);
	});

	it('boolean (true)', () => {
		const res = parse(`
		let x = true
		`);
		assert.deepStrictEqual(res, [
			Ast.DEF('x', Ast.TRUE(), false),
		]);
	});

	it('boolean (false)', () => {
		const res = parse(`
		let x = false
		`);
		assert.deepStrictEqual(res, [
			Ast.DEF('x', Ast.FALSE(), false),
		]);
	});

	it('null', () => {
		const res = parse(`
		let x = null
		`);
		assert.deepStrictEqual(res, [
			Ast.DEF('x', Ast.NULL(), false),
		]);
	});

	describe('obj', () => {
		it('empty', () => {
			const res = parse(`
			let x = {}
			`);
			assert.deepStrictEqual(res, [
				Ast.DEF('x', Ast.OBJ(new Map<string, Ast.Node>()), false),
			]);
		});

		describe('single entry', () => {
			it('basic', () => {
				const res = parse(`
				let x = { a: 1 }
				`);
				assert.deepStrictEqual(res, [
					Ast.DEF('x', Ast.OBJ(new Map<string, Ast.Node>([
						['a', Ast.NUM(1)],
					])), false),
				]);
			});

			it('with separator ";"', () => {
				const res = parse(`
				let x = {
					a: 1;
				}
				`);
				assert.deepStrictEqual(res, [
					Ast.DEF('x', Ast.OBJ(new Map<string, Ast.Node>([
						['a', Ast.NUM(1)],
					])), false),
				]);
			});
		});

		describe('multiple entry', () => {
			it('with separator ","', () => {
				const res = parse(`
				let x = { a: 1, b: "xyz" }
				`);
				assert.deepStrictEqual(res, [
					Ast.DEF('x', Ast.OBJ(new Map<string, Ast.Node>([
						['a', Ast.NUM(1)],
						['b', Ast.STR('xyz')],
					])), false),
				]);
			});

			it('with separator ";"', () => {
				const res = parse(`
				let x = { a: 1; b: "xyz"; }
				`);
				assert.deepStrictEqual(res, [
					Ast.DEF('x', Ast.OBJ(new Map<string, Ast.Node>([
						['a', Ast.NUM(1)],
						['b', Ast.STR('xyz')],
					])), false),
				]);
			});

			it('with spacing-separator', () => {
				const res = parse(`
				let x = {
					a: 1
					b: "xyz"
				}
				`);
				assert.deepStrictEqual(res, [
					Ast.DEF('x', Ast.OBJ(new Map<string, Ast.Node>([
						['a', Ast.NUM(1)],
						['b', Ast.STR('xyz')],
					])), false),
				]);
			});

			it('with separator "," (multiline)', () => {
				const res = parse(`
				let x = {
					a: 1,
					b:"xyz"
				}
				`);
				assert.deepStrictEqual(res, [
					Ast.DEF('x', Ast.OBJ(new Map<string, Ast.Node>([
						['a', Ast.NUM(1)],
						['b', Ast.STR('xyz')],
					])), false),
				]);
			});

			it('with separator ";" (multiline)', () => {
				const res = parse(`
				let x = {
					a: 1;
					b:"xyz";
				}
				`);
				assert.deepStrictEqual(res, [
					Ast.DEF('x', Ast.OBJ(new Map<string, Ast.Node>([
						['a', Ast.NUM(1)],
						['b', Ast.STR('xyz')],
					])), false),
				]);
			});
		});
	});
});
