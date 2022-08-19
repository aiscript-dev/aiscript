import * as aiscript from '../..';
import { Node } from '../../node';

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
			case 'fn': {
				validateKeyword(node.children);
				break;
			}
			case 'block': {
				validateKeyword(node.statements);
				break;
			}
			case 'if': {
				if (node.then.type === 'block') {
					validateKeyword(node.then.statements);
				}
				for (const n of node.elseif) {
					if (n.then.type === 'block') {
						validateKeyword(n.then.statements);
					}
				}
				if (node.else?.type === 'block') {
					validateKeyword(node.else.statements);
				}
				break;
			}
			// TODO: match
		}
	}

	return nodes;
}
