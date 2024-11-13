import { visitNode } from '../visit.js';
import { AiScriptSyntaxError } from '../../error.js';

import type * as Ast from '../../node.js';

function isInLoopScope(ancestors: Ast.Node[]): boolean {
	for (let i = ancestors.length - 1; i >= 0; i--) {
		switch (ancestors[i]!.type) {
			case 'loop':
			case 'for':
			case 'each':
				return true;
			case 'fn':
				return false;
		}
	}
	return false;
}

function validateNode(node: Ast.Node, ancestors: Ast.Node[]): Ast.Node {
	switch (node.type) {
		case 'return': {
			if (!ancestors.some(({ type }) => type === 'fn')) {
				throw new AiScriptSyntaxError('return must be inside function', node.loc.start);
			}
			break;
		}
		case 'break': {
			if (!isInLoopScope(ancestors)) {
				throw new AiScriptSyntaxError('break must be inside for / each / while / do-while / loop', node.loc.start);
			}
			break;
		}
		case 'continue': {
			if (!isInLoopScope(ancestors)) {
				throw new AiScriptSyntaxError('continue must be inside for / each / while / do-while / loop', node.loc.start);
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
