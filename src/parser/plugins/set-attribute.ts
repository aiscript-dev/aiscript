import { SyntaxError } from '../../error';
import type * as Cst from '../node';

export function setAttribute(node: Cst.Expression[]): Cst.Expression[]
export function setAttribute(node: Cst.Statement[]): Cst.Statement[]
export function setAttribute(node: (Cst.Statement | Cst.Expression)[]): (Cst.Statement | Cst.Expression)[]
export function setAttribute(node: Cst.Node[]): Cst.Node[]
export function setAttribute(nodes: Cst.Node[]): Cst.Node[] {
	const result: Cst.Node[] = [];
	const stockedAttrs: Cst.Attribute[] = [];

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
				node.expr.children = setAttribute(node.expr.children);
			}
			result.push(node);
		} else {
			if (stockedAttrs.length > 0) {
				throw new SyntaxError('invalid attribute.');
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
		throw new SyntaxError('invalid attribute.');
	}

	return result;
}
