import * as aiscript from '../..';
import { Node } from '../node';

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

function throwReservedWordError(name: string) {
	throw new aiscript.SemanticError(`Reserved word "${name}" cannot be used as variable name.`);
}

export function validateKeyword(nodes: Node[]): Node[] {
	for (const node of nodes) {
		switch (node.type) {
			case 'def':
			case 'ns': {
				if (reservedWord.includes(node.name)) {
					throwReservedWordError(node.name);
				}
				break;
			}
			case 'assign': {
				if (node.dest.type === 'var' && node.dest.chain == null) {
					if (reservedWord.includes(node.dest.name)) {
						throwReservedWordError(node.dest.name);
					}
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
