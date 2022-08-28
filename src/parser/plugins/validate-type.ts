import * as aiscript from '../..';
import { SemanticError } from '../../error';
import * as Ast from '../node';
import { getTypeBySource } from '../../type';

function validate(node: Ast.Node) {
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
				if (arg.type != null) {
					getTypeBySource(arg.type);
				}
			}
			if (node.ret != null) {
				getTypeBySource(node.ret);
			}
			for (const n of node.children) {
				validate(n);
			}
			break;
		}
	}
	// TODO: ブロックも全部スキャン
}

export function validateType(nodes: Ast.Node[]): Ast.Node[] {
	for (const node of nodes) {
		validate(node);
	}
	return nodes;
}
