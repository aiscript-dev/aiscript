import * as aiscript from '../..';
import { SemanticError } from '../../error';
import { Node } from '../../node';
import { getTypeBySource } from '../../type';

function validate(node: Node) {
	switch (node.type) {
		case 'def': {
			if (node.varType != null) {
				getTypeBySource(node.varType);
			}
			validate(node.expr);
			break;
		}
		case 'fn': {
			for (const arg of node.args) {
				if (arg.argType != null) {
					getTypeBySource(arg.argType);
				}
			}
			if (node.ret != null) {
				getTypeBySource(node.ret);
			}
			break;
		}
	}
	// TODO: ブロックも全部スキャン
}

export function validateType(nodes: Node[]): Node[] {
	for (const node of nodes) {
		validate(node);
	}
	return nodes;
}
