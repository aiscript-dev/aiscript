import { AiScriptSyntaxError } from '../../error.js';
import { visitNode } from '../visit.js';
import type * as Ast from '../../node.js';

const reservedWord = [
	'null',
	'true',
	'false',
	'each',
	'for',
	'loop',
	'break',
	'continue',
	'match',
	'if',
	'elif',
	'else',
	'return',
	'eval',
	'var',
	'let',
	'exists',

	// future
	'fn',
	'namespace',
	'meta',
	'attr',
	'attribute',
	'static',
	'class',
	'struct',
	'module',
	'while',
	'import',
	'export',
	// 'const',
	// 'def',
	// 'func',
	// 'function',
	// 'ref',
	// 'out',
];

function throwReservedWordError(name: string, loc: Ast.Loc): void {
	throw new AiScriptSyntaxError(`Reserved word "${name}" cannot be used as variable name.`, loc);
}

function validateNode(node: Ast.Node): Ast.Node {
	switch (node.type) {
		case 'def':
		case 'attr':
		case 'ns':
		case 'identifier': {
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
		case 'fn': {
			for (const arg of node.args) {
				if (reservedWord.includes(arg.name)) {
					throwReservedWordError(arg.name, node.loc);
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
