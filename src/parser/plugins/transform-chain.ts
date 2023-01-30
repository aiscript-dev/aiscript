import * as Cst from '../node';
import { visitNode } from '../visit';

function transformNode(node: Cst.Node): Cst.Node {
	// chain
	if (Cst.isExpression(node) && Cst.hasChainProp(node) && node.chain != null) {
		const { chain, ...hostNode } = node;
		let parent: Cst.Expression = hostNode;
		for (const item of chain) {
			switch (item.type) {
				case 'callChain': {
					parent = Cst.CALL(parent, item.args, item.loc);
					break;
				}
				case 'indexChain': {
					parent = Cst.INDEX(parent, item.index, item.loc);
					break;
				}
				case 'propChain': {
					parent = Cst.PROP(parent, item.name, item.loc);
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

export function transformChain(nodes: Cst.Node[]): Cst.Node[] {
	for (let i = 0; i < nodes.length; i++) {
		nodes[i] = visitNode(nodes[i]!, transformNode);
	}
	return nodes;
}
