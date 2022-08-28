import * as aiscript from '../..';
import { SemanticError } from '../../error';
import * as Ast from '../node';
import { getTypeBySource } from '../../type';
import { visitNode } from '../visit';

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
				if (arg.type != null) {
					getTypeBySource(arg.type);
				}
			}
			if (node.ret != null) {
				getTypeBySource(node.ret);
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
