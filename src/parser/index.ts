import { Node } from "../node";
const parseInternal = require('./parser.js').parse;

type NAttr = {
	type: 'attr'; // 属性
	name: string; // 属性名
	value: Node; // 値
};

function applyAttr(nodes: (Node | NAttr)[]): Node[] {
	const result: Node[] = [];
	const stockedAttrs: NAttr[] = [];

	for (const node of nodes) {
		if (node.type == 'attr') {
			stockedAttrs.push(node);
		}
		else if (node.type == 'def') {
			const kvp = stockedAttrs.map(attr => { return { k: attr.name, v: attr.value }; });
			for (const kv of kvp) {
				node.attr.set(kv.k, kv.v);
			}
			// clear all
			stockedAttrs.splice(0, stockedAttrs.length);
			if (node.expr.type == 'fn') {
				node.expr.children = applyAttr(node.expr.children);
			}
			result.push(node);
		}
		else if (stockedAttrs.length == 0) {
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
		else {
			throw new Error('invalid attribute');
		}
	}

	return result;
}

export function parse(input: string): Node[] {
	const nodes: (Node | NAttr)[] = parseInternal(input);
	return applyAttr(nodes);
}
