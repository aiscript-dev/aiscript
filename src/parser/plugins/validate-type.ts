import * as aiscript from '../..';
import { SemanticError } from '../../error';
import { Node } from '../../node';

function validate(node: Node) {
	switch (node.type) {
		case 'def': {
			if (node.varType != null) {
				throw new SemanticError('Type definition is not supported.');
			}
			validate(node.expr);
			break;
		}
		case 'fn': {
			for (const arg of node.args) {
				if (arg.argType != null) {
					throw new SemanticError('Type definition is not supported.');
				}
			}
			if (node.ret != null) {
				throw new SemanticError('Type definition is not supported.');
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
