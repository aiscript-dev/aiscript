import * as assert from 'assert';
import { Parser } from '../src';
import * as Ast from '../src/node';
import * as Types from '../src/type';
import { createNode } from '../src/parser/util';

function N_STR(value: string): Ast.NStr {
	return createNode('str', { value }) as Ast.NStr;
}

function N_TMPL(tmpl: (string | Ast.Node)[]): Ast.NTmpl {
	return createNode('tmpl', { tmpl }) as Ast.NTmpl;
}

function N_DEF(name: string, varType: Types.TypeSource | null, expr: Ast.Node, mut: boolean, attr: Ast.NAttr[]): Ast.NDef {
	return createNode('def', { name, varType, expr, mut, attr }) as Ast.NDef;
}

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
			N_DEF('abc', null, N_STR('xyz'), false, []),
		]);
	});

	it('template', async () => {
		const res = parse(`
		let abc = \`abc{"123"}\`
		`);
		assert.deepStrictEqual(res, [
			N_DEF('abc', null, N_TMPL(['abc', N_STR('123')]), false, []),
		]);
	});
});

describe('varDef (var)', () => {
	it('string', async () => {
		const res = parse(`
		var abc = "xyz"
		`);
		assert.deepStrictEqual(res, [
			N_DEF('abc', null, N_STR('xyz'), true, []),
		]);
	});

	it('template', async () => {
		const res = parse(`
		var abc = \`abc{"123"}\`
		`);
		assert.deepStrictEqual(res, [
			N_DEF('abc', null, N_TMPL(['abc', N_STR('123')]), true, []),
		]);
	});
});
