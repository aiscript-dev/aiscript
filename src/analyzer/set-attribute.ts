import * as aiscript from '..';
import { Node, NAttr } from '../node';

export function setAttribute(nodes: Node[]): Node[] {
	const result: Node[] = [];
	const stockedAttrs: NAttr[] = [];

	for (const node of nodes) {
		if (node.type == 'attr') {
			stockedAttrs.push(node);
		} else if (node.type == 'def') {
			node.attr.push(...stockedAttrs);
			// clear all
			stockedAttrs.splice(0, stockedAttrs.length);
			if (node.expr.type == 'fn') {
				node.expr.children = setAttribute(node.expr.children);
			}
			result.push(node);
		} else {
			if (stockedAttrs.length > 0) {
				throw new aiscript.SemanticError('invalid attribute.');
			}
			switch (node.type) {
				case 'fn': {
					node.children = setAttribute(node.children);
					break;
				}
				case 'block': {
					node.statements = setAttribute(node.statements);
					break;
				}
			}
			result.push(node);
		}
	}
	if (stockedAttrs.length > 0) {
		throw new aiscript.SemanticError('invalid attribute.');
	}

	return result;
}
