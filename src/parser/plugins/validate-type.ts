import { getTypeBySource } from '../../type.js';
import { visitNode } from '../visit.js';
import type * as Ast from '../../node.js';

function collectTypeParams(node: Ast.Node, ancestors: Ast.Node[]): Ast.TypeParam[] {
	const items = [];
	if (node.type === 'fn') {
		const typeParamNames = new Set<string>();
		for (const typeParam of node.typeParams) {
			if (typeParamNames.has(typeParam.name)) {
				throw new Error(`type parameter name ${typeParam.name} is duplicate`);
			}
			typeParamNames.add(typeParam.name);
		}
		items.push(...node.typeParams);
	}
	for (let i = ancestors.length - 1; i >= 0; i--) {
		const ancestor = ancestors[i]!;
		if (ancestor.type === 'fn') {
			items.push(...ancestor.typeParams);
		}
	}
	return items;
}

function validateNode<T extends Ast.Node>(node: T, ancestors: Ast.Node[]): T {
	switch (node.type) {
		case 'def': {
			if (node.varType != null) {
				getTypeBySource(node.varType, collectTypeParams(node, ancestors));
			}
			break;
		}
		case 'fn': {
			for (const param of node.params) {
				if (param.argType != null) {
					getTypeBySource(param.argType, collectTypeParams(node, ancestors));
				}
			}
			if (node.retType != null) {
				getTypeBySource(node.retType, collectTypeParams(node, ancestors));
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
