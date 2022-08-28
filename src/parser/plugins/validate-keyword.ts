import * as aiscript from '../..';
import * as Ast from '../node';

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

function validate(node: Ast.Node): void {
	switch (node.type) {
		case 'def':
		case 'ns': {
			if (reservedWord.includes(node.name)) {
				throwReservedWordError(node.name);
			}
			break;
		}
		case 'inc':
		case 'dec':
		case 'assign': {
			if (node.dest.type === 'var') {
				if (reservedWord.includes(node.dest.name)) {
					throwReservedWordError(node.dest.name);
				}
			}
			validate(node.dest);
			validate(node.expr);
			break;
		}
		case 'fn': {
			for (const inner of node.children) {
				validate(inner);
			}
			break;
		}
		case 'block': {
			for (const inner of node.statements) {
				validate(inner);
			}
			break;
		}
		case 'if': {
			if (node.then.type === 'block') {
				for (const inner of node.then.statements) {
					validate(inner);
				}
			}
			for (const n of node.elseif) {
				if (n.then.type === 'block') {
					for (const inner of n.then.statements) {
						validate(inner);
					}
				}
			}
			if (node.else?.type === 'block') {
				for (const inner of node.else.statements) {
					validate(inner);
				}
			}
			break;
		}
		// TODO: match
	}

	if (Ast.hasChainProp(node)) {
		if (node.chain != null) {
			for (const item of node.chain) {
				if (item.type === 'propChain') {
					if (reservedWord.includes(item.name)) {
						throwReservedWordError(item.name);
					}
				}
			}
		}
	}
}

export function validateKeyword(nodes: Ast.Node[]): Ast.Node[] {
	for (const inner of nodes) {
		validate(inner);
	}
	return nodes;
}
