import { visitNode } from '../visit.js';
import { AiScriptSyntaxError } from '../../error.js';

import type * as Ast from '../../node.js';

function validateNode(node: Ast.Node, ancestors: Ast.Node[]): Ast.Node {
	switch (node.type) {
		case 'return': {
			if (!ancestors.some(({ type }) => type === 'fn')) {
				throw new AiScriptSyntaxError('return must be inside function', node.loc.start);
			}
			break;
		}
		case 'break': {
			if (!ancestors.some(({ type }) => type === 'loop' || type === 'for' || type === 'each')) {
				throw new AiScriptSyntaxError('break must be inside loop / for / each', node.loc.start);
			}
			break;
		}
		case 'continue': {
			if (!ancestors.some(({ type }) => type === 'loop' || type === 'for' || type === 'each')) {
				throw new AiScriptSyntaxError('continue must be inside loop / for / each', node.loc.start);
			}
			break;
		}
	}
	return node;
}

export function validateJumpStatements(nodes: Ast.Node[]): Ast.Node[] {
	for (const node of nodes) {
		visitNode(node, validateNode);
	}
	return nodes;
}
