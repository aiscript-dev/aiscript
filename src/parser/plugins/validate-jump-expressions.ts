import { visitNode } from '../visit.js';
import { AiScriptSyntaxError } from '../../error.js';

import type * as Ast from '../../node.js';

function getCorrespondingBlock(ancestors: Ast.Node[], label?: string): Ast.ControlFlow | undefined {
	for (let i = ancestors.length - 1; i >= 0; i--) {
		const ancestor = ancestors[i]!;
		switch (ancestor.type) {
			case 'loop':
			case 'for':
			case 'each': {
				if (label != null && label !== ancestor.label) {
					continue;
				}
				return ancestor;
			}
			case 'if':
			case 'match':
			case 'block': {
				if (label == null || label !== ancestor.label) {
					continue;
				}
				return ancestor;
			}
			case 'fn':
				return;
		}
	}
	return;
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
			if (getCorrespondingBlock(ancestors, node.label) == null) {
				if (node.label != null) {
					throw new AiScriptSyntaxError(`label "${node.label}" is not defined`, node.loc.start);
				}
				throw new AiScriptSyntaxError('unlabeled break must be inside for / each / while / do-while / loop', node.loc.start);
			}
			break;
		}
		case 'continue': {
			const block = getCorrespondingBlock(ancestors, node.label);
			if (block == null) {
				if (node.label != null) {
					throw new AiScriptSyntaxError(`label "${node.label}" is not defined`, node.loc.start);
				}
				throw new AiScriptSyntaxError('continue must be inside for / each / while / do-while / loop', node.loc.start);
			} else {
				switch (block.type) {
					case 'if':
						throw new AiScriptSyntaxError('cannot use continue for if', node.loc.start);
					case 'match':
						throw new AiScriptSyntaxError('cannot use continue for match', node.loc.start);
					case 'block':
						throw new AiScriptSyntaxError('cannot use continue for eval', node.loc.start);
				}
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
