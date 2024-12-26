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
];

function throwReservedWordError(name: string, loc: Ast.Loc): void {
	throw new AiScriptSyntaxError(`Reserved word "${name}" cannot be used as variable name.`, loc.start);
}

function validateDest(node: Ast.Node): Ast.Node {
	return visitNode(node, node => {
		switch (node.type) {
			case 'null': {
				throwReservedWordError(node.type, node.loc);
				break;
			}
			case 'bool': {
				throwReservedWordError(`${node.value}`, node.loc);
				break;
			}
			case 'identifier': {
				if (reservedWord.includes(node.name)) {
					throwReservedWordError(node.name, node.loc);
				}
				break;
			}
		}

		return node;
	});
}

function validateTypeParams(node: Ast.Fn | Ast.FnTypeSource): void {
	for (const typeParam of node.typeParams) {
		if (reservedWord.includes(typeParam.name)) {
			throwReservedWordError(typeParam.name, node.loc);
		}
	}
}

function validateNode<T extends Ast.Node>(node: T): T {
	switch (node.type) {
		case 'def': {
			validateDest(node.dest);
			break;
		}
		case 'ns':
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
			validateDest(node.var);
			break;
		}
		case 'for': {
			if (node.var != null && reservedWord.includes(node.var)) {
				throwReservedWordError(node.var, node.loc);
			}
			break;
		}
		case 'fn': {
			validateTypeParams(node);
			for (const param of node.params) {
				validateDest(param.dest);
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
		case 'namedTypeSource': {
			if (reservedWord.includes(node.name)) {
				throwReservedWordError(node.name, node.loc);
			}
			break;
		}
		case 'fnTypeSource': {
			validateTypeParams(node);
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
