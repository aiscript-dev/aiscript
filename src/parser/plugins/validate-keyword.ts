import { SyntaxError } from '../../error';
import { visitNode } from '../visit';
import type * as Cst from '../node';

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

function throwReservedWordError(name: string): void {
	throw new SyntaxError(`Reserved word "${name}" cannot be used as variable name.`);
}

function validateNode(node: Cst.Node): Cst.Node {
	switch (node.type) {
		case 'def':
		case 'attr':
		case 'ns':
		case 'identifier':
		case 'propChain': {
			if (reservedWord.includes(node.name)) {
				throwReservedWordError(node.name);
			}
			break;
		}
		case 'meta': {
			if (node.name != null && reservedWord.includes(node.name)) {
				throwReservedWordError(node.name);
			}
			break;
		}
		case 'fn': {
			for (const arg of node.args) {
				if (reservedWord.includes(arg.name)) {
					throwReservedWordError(arg.name);
				}
			}
			break;
		}
	}

	return node;
}

export function validateKeyword(nodes: Cst.Node[]): Cst.Node[] {
	for (const inner of nodes) {
		visitNode(inner, validateNode);
	}
	return nodes;
}
