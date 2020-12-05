import { Node, NAttr } from '../node';
const parseInternal = require('../../built/parser/parser.js').parse;

function applyAttr(nodes: Node[]): Node[] {
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
				node.expr.children = applyAttr(node.expr.children);
			}
			result.push(node);
		} else {
			if (stockedAttrs.length > 0) {
				throw new Error('invalid attribute');
			}
			switch (node.type) {
				case 'fn': {
					node.children = applyAttr(node.children);
					break;
				}
				case 'block': {
					node.statements = applyAttr(node.statements);
					break;
				}
			}
			result.push(node);
		}
	}

	return result;
}

export function parse(input: string): Node[] {
	const nodes: Node[] = parseInternal(input);
	return applyAttr(nodes);
}
