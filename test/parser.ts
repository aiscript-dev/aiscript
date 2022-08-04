import * as assert from 'assert';
import { Parser } from '../src';
import * as Ast from '../src/node';

function parse(program: string) {
	const parser = new Parser();
	return parser.parse(program);
}

it('comment line', async () => {
	const res = parse('// abc');
	assert.deepStrictEqual(res, []);
});

describe('statements', () => {
	it('varDef (let)', async () => {
		const res = parse(`
		let abc = "xyz"
		`);
		assert.deepStrictEqual(res, [
			Ast.DEF('abc', Ast.STR('xyz'), false, { varType: undefined, attr: [] }),
		]);
	});

	it('varDef (var)', async () => {
		const res = parse(`
		var abc = "xyz"
		`);
		assert.deepStrictEqual(res, [
			Ast.DEF('abc', Ast.STR('xyz'), true, { varType: undefined, attr: [] }),
		]);
	});

	it('out', async () => {
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
	describe('literals', () => {
		it('string', async () => {
			const res = parse(`
			let x = "xyz"
			`);
			assert.deepStrictEqual(res, [
				Ast.DEF('x', Ast.STR('xyz'), false),
			]);
		});

		it('template', async () => {
			const res = parse(`
			let x = \`abc{"123"}\`
			`);
			assert.deepStrictEqual(res, [
				Ast.DEF('x', Ast.TMPL(['abc', Ast.STR('123')]), false),
			]);
		});

		it('number', async () => {
			const res = parse(`
			let x = 100
			`);
			assert.deepStrictEqual(res, [
				Ast.DEF('x', Ast.NUM(100), false),
			]);
		});

		it('boolean (true)', async () => {
			const res = parse(`
			let x = true
			`);
			assert.deepStrictEqual(res, [
				Ast.DEF('x', Ast.TRUE(), false),
			]);
		});

		it('boolean (false)', async () => {
			const res = parse(`
			let x = false
			`);
			assert.deepStrictEqual(res, [
				Ast.DEF('x', Ast.FALSE(), false),
			]);
		});

		it('null', async () => {
			const res = parse(`
			let x = null
			`);
			assert.deepStrictEqual(res, [
				Ast.DEF('x', Ast.NULL(), false),
			]);
		});

		describe('obj', () => {
			it('empty', async () => {
				const res = parse(`
				let x = {}
				`);
				assert.deepStrictEqual(res, [
					Ast.DEF('x', Ast.OBJ(new Map<string, Ast.Node>()), false),
				]);
			});

			describe('single entry', () => {
				it('basic', async () => {
					const res = parse(`
					let x = {a:1}
					`);
					assert.deepStrictEqual(res, [
						Ast.DEF('x', Ast.OBJ(new Map<string, Ast.Node>([
							['a', Ast.NUM(1)],
						])), false),
					]);
				});

				it('with separator', async () => {
					const res = parse(`
					let x = {a:1,}
					`);
					assert.deepStrictEqual(res, [
						Ast.DEF('x', Ast.OBJ(new Map<string, Ast.Node>([
							['a', Ast.NUM(1)],
						])), false),
					]);
				});
			});

			describe('multiple entry', () => {
				it('with separator', async () => {
					const res = parse(`
					let x = {a:1,b:"xyz"}
					`);
					assert.deepStrictEqual(res, [
						Ast.DEF('x', Ast.OBJ(new Map<string, Ast.Node>([
							['a', Ast.NUM(1)],
							['b', Ast.STR('xyz')],
						])), false),
					]);
				});

				it('with spacing-separator', async () => {
					const res = parse(`
					let x = {
						a: 1
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
			});

			it('multiline', async () => {
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
		});
	});
});
