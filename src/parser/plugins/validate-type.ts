import { getTypeBySource } from '../../type.js';
import { visitNode } from '../visit.js';
import type * as Ast from '../../node.js';

function validateNode(node: Ast.Node): Ast.Node {
	switch (node.type) {
		case 'def': {
			if (node.varType != null) {
				getTypeBySource(node.varType);
			}
			break;
		}
		case 'fn': {
			for (const arg of node.args) {
				if (arg.argType != null) {
					getTypeBySource(arg.argType);
				}
			}
			if (node.retType != null) {
				getTypeBySource(node.retType);
			}
			break;
		}
	}

	return node;
}

export function validateType(nodes: Ast.Node[]): Ast.Node[] {
	for (const node of nodes) {
		visitNode(node, validateNode);
	}
	return nodes;
}
