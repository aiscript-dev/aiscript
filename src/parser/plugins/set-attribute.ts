import * as aiscript from '../..';
import * as Ast from '../node';

export function setAttribute(nodes: Ast.Node[]): Ast.Node[] {
	const result: Ast.Node[] = [];
	const stockedAttrs: Ast.Attribute[] = [];

	for (const node of nodes) {
		if (node.type === 'attr') {
			stockedAttrs.push(node);
		} else if (node.type === 'def') {
			if (node.attr == null) {
				node.attr = [];
			}
			node.attr.push(...stockedAttrs);
			// clear all
			stockedAttrs.splice(0, stockedAttrs.length);
			if (node.expr.type === 'fn') {
				node.expr.children = setAttribute(node.expr.children) as Ast.Fn['children'];
			}
			result.push(node);
		} else {
			if (stockedAttrs.length > 0) {
				throw new aiscript.SemanticError('invalid attribute.');
			}
			switch (node.type) {
				case 'fn': {
					node.children = setAttribute(node.children) as Ast.Fn['children'];
					break;
				}
				case 'block': {
					node.statements = setAttribute(node.statements) as Ast.Block['statements'];
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
