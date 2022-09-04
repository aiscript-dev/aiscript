import { AiScriptError } from '../../error';
import * as Ast from '../node';

export function setAttribute(node: Ast.Expression[]): Ast.Expression[]
export function setAttribute(node: Ast.Statement[]): Ast.Statement[]
export function setAttribute(node: (Ast.Statement | Ast.Expression)[]): (Ast.Statement | Ast.Expression)[]
export function setAttribute(node: Ast.Node[]): Ast.Node[]
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
				node.expr.children = setAttribute(node.expr.children);
			}
			result.push(node);
		} else {
			if (stockedAttrs.length > 0) {
				throw new AiScriptError('invalid attribute.');
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
		throw new AiScriptError('invalid attribute.');
	}

	return result;
}
