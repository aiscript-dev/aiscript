import { getTypeBySource } from '../../type.js';
import { visitNode } from '../visit.js';
import type * as Cst from '../node.js';

function validateNode(node: Cst.Node): Cst.Node {
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

export function validateType(nodes: Cst.Node[]): Cst.Node[] {
	for (const node of nodes) {
		visitNode(node, validateNode);
	}
	return nodes;
}
