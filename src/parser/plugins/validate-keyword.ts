import { AiScriptSyntaxError } from '../../error.js';
import { visitNode } from '../visit.js';
import type * as Ast from '../../node.js';

// 予約語となっている識別子があるかを確認する。
// - キーワードは字句解析の段階でそれぞれのKeywordトークンとなるが、エスケープシーケンスを含む場合はIdentifierトークンとなるので検証を行う。
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

const keywords = [
	'null',
	'true',
	'false',
	'each',
	'for',
	'loop',
	'do',
	'while',
	'break',
	'continue',
	'match',
	'case',
	'default',
	'if',
	'elif',
	'else',
	'return',
	'eval',
	'var',
	'let',
	'exists',
];

function validateName(name: string, pos: Ast.Pos): void {
	if (reservedWord.includes(name)) {
		throw new AiScriptSyntaxError(`Reserved word "${name}" cannot be used as identifier.`, pos);
	}
	if (keywords.includes(name)) {
		throw new AiScriptSyntaxError(`Keyword "${name}" cannot be used as identifier.`, pos);
	}
}

function validateTypeName(name: string, pos: Ast.Pos): void {
	if (name === 'null') {
		return;
	}
	validateName(name, pos);
}

function throwReservedWordError(name: string, pos: Ast.Pos): void {
	throw new AiScriptSyntaxError(`Reserved word "${name}" cannot be used as variable name.`, pos);
}

function validateDest(node: Ast.Node): Ast.Node {
	return visitNode(node, node => {
		switch (node.type) {
			case 'null': {
				throwReservedWordError(node.type, node.loc.start);
				break;
			}
			case 'bool': {
				throwReservedWordError(`${node.value}`, node.loc.start);
				break;
			}
			case 'identifier': {
				validateName(node.name, node.loc.start);
				break;
			}
		}

		return node;
	});
}

function validateTypeParams(node: Ast.Fn | Ast.FnTypeSource): void {
	for (const typeParam of node.typeParams) {
		validateTypeName(typeParam.name, node.loc.start);
	}
}

function validateNode(node: Ast.Node): Ast.Node {
	switch (node.type) {
		case 'def': {
			validateDest(node.dest);
			break;
		}
		case 'ns':
		case 'attr':
		case 'identifier':
		case 'prop': {
			validateName(node.name, node.loc.start);
			break;
		}
		case 'meta': {
			if (node.name != null) {
				validateName(node.name, node.loc.start);
			}
			break;
		}
		case 'each': {
			if (node.label != null) {
				validateName(node.label, node.loc.start);
			}
			validateDest(node.var);
			break;
		}
		case 'for': {
			if (node.label != null) {
				validateName(node.label, node.loc.start);
			}
			if (node.var != null) {
				validateName(node.var, node.loc.start);
			}
			break;
		}
		case 'loop': {
			if (node.label != null) {
				validateName(node.label, node.loc.start);
			}
			break;
		}
		case 'break': {
			if (node.label != null) {
				validateName(node.label, node.loc.start);
			}
			break;
		}
		case 'continue': {
			if (node.label != null) {
				validateName(node.label, node.loc.start);
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
		case 'namedTypeSource': {
			validateTypeName(node.name, node.loc.start);
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
