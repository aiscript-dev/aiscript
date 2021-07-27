import * as aiscript from '..';
import { Node } from '../node';

const reservedWord = [
	'_',
	'yes',
	'no',
	'true',
	'false',
	'each',
	'for',
	'loop',
	'while',
	'break',
	'continue',
	'match',
	'if',
	'elif',
	'else',
	'return',
	// 'namespace',
	// 'meta',
	// 'attr',
	// 'attribute',
	// 'static',
	// 'const',
	// 'null',
	// 'var',
	// 'def',
	// 'fn',
	// 'func',
	// 'function',
	// 'class',
	// 'module',
	// 'ref',
	// 'out',
];

export function validateKeyword(nodes: Node[]): Node[] {

	for (const node of nodes) {
		switch (node.type) {
			case 'def':
			case 'assign':
			case 'ns': {
				if (reservedWord.includes(node.name)) {
					throw new aiscript.SemanticError(`Reserved word "${node.name}" cannot be used as variable name.`);
				}
				break;
			}
		}
	}

	return nodes;
}
