import * as Ast from '../node';

function transform(node: Ast.Node): Ast.Node {
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
		return parent;
	}
	else {
		return node;
	}
}

export function transformChain(nodes: Ast.Node[]): Ast.Node[] {
	for (let i = 0; i < nodes.length; i++) {
		nodes[i] = transform(nodes[i]);

		const node = nodes[i];
		switch (node.type) {
			case 'inc':
			case 'dec':
			case 'assign': {
				node.expr = transform(node.expr) as Ast.Assign['expr'];
				node.dest = transform(node.dest) as Ast.Assign['dest'];
				break;
			}
			case 'call': {
				node.args = transformChain(node.args) as Ast.Call['args'];
				break;
			}
			case 'index': {
				node.index = transform(node.index) as Ast.Index['index'];
				break;
			}
		}
	}
	return nodes;
}
