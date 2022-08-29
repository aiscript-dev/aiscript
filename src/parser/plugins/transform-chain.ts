import * as Ast from '../node';
import { visitNode } from '../visit';

function transformNode(node: Ast.Node): Ast.Node {
	// chain
	if (Ast.isExpression(node) && Ast.hasChainProp(node) && node.chain != null) {
		const { chain, ...hostNode } = node;
		let parent: Ast.Expression = hostNode;
		for (const item of chain) {
			switch (item.type) {
				case 'callChain': {
					parent = Ast.CALL(parent, item.args, item.loc);
					break;
				}
				case 'indexChain': {
					parent = Ast.INDEX(parent, item.index, item.loc);
					break;
				}
				case 'propChain': {
					parent = Ast.PROP(parent, item.name, item.loc);
					break;
				}
				default: {
					break;
				}
			}
		}
		return parent;
	}

	return node;
}

export function transformChain(nodes: Ast.Node[]): Ast.Node[] {
	for (let i = 0; i < nodes.length; i++) {
		nodes[i] = visitNode(nodes[i], transformNode);
	}
	return nodes;
}
