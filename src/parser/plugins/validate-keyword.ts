import { AiScriptSyntaxError } from '../../error.js';
import { visitNode } from '../visit.js';
import type * as Ast from '../../node.js';

// 予約語となっている識別子があるかを確認する。
// - キーワードは字句解析の段階でそれぞれのKeywordトークンとなるため除外
// - 文脈キーワードは識別子に利用できるため除外

const reservedWord = [
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
	// 'dictionary',
	'do',
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
	'while',
	'yield',
	'import',
	'is',
	'meta',
	'module',
	'namespace',
	'new',
];

function throwReservedWordError(name: string, loc: Ast.Loc): void {
	throw new AiScriptSyntaxError(`Reserved word "${name}" cannot be used as variable name.`, loc);
}

function validateNode(node: Ast.Node): Ast.Node {
	switch (node.type) {
		case 'ns':
		case 'def':
		case 'attr':
		case 'identifier':
		case 'prop': {
			if (reservedWord.includes(node.name)) {
				throwReservedWordError(node.name, node.loc);
			}
			break;
		}
		case 'meta': {
			if (node.name != null && reservedWord.includes(node.name)) {
				throwReservedWordError(node.name, node.loc);
			}
			break;
		}
		case 'each': {
			if (reservedWord.includes(node.var)) {
				throwReservedWordError(node.var, node.loc);
			}
			break;
		}
		case 'for': {
			if (node.var != null && reservedWord.includes(node.var)) {
				throwReservedWordError(node.var, node.loc);
			}
			break;
		}
		case 'fn': {
			for (const arg of node.args) {
				if (reservedWord.includes(arg.name)) {
					throwReservedWordError(arg.name, node.loc);
				}
			}
			break;
		}
		case 'obj': {
			for (const name of node.value.keys()) {
				if (reservedWord.includes(name)) {
					throwReservedWordError(name, node.loc);
				}
			}
			break;
		}
	}

	return node;
}

export function validateKeyword(nodes: Ast.Node[]): Ast.Node[] {
	for (const inner of nodes) {
		visitNode(inner, validateNode);
	}
	return nodes;
}
