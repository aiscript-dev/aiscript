import * as Ast from '../node';

function transformNode(node: Ast.Node): Ast.Node {
	let result = node;

	if (Ast.isChainHost(node) && node.chain != null) {
		const { chain, ...hostNode } = node;
		let parent: Ast.ChainElement = hostNode;
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
		result = parent;
	}

	// nested nodes
	switch (result.type) {
		case 'inc':
		case 'dec':
		case 'assign': {
			result.expr = transformNode(result.expr) as Ast.Assign['expr'];
			result.dest = transformNode(result.dest) as Ast.Assign['dest'];
			break;
		}
		case 'call': {
			result.args = transformChain(result.args) as Ast.Call['args'];
			break;
		}
		case 'index': {
			result.index = transformNode(result.index) as Ast.Index['index'];
			break;
		}
	}

	return result;
}

export function transformChain(nodes: Ast.Node[]): Ast.Node[] {
	for (let i = 0; i < nodes.length; i++) {
		nodes[i] = transformNode(nodes[i]);
	}
	return nodes;
}
