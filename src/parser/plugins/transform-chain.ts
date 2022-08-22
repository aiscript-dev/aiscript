import * as Ast from '../node';

function visitNode(node: Ast.Node): Ast.Node {
	let result = node;

	// transform chain
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
		case 'def': {
			result.expr = visitNode(result.expr) as Ast.Definition['expr'];
			break;
		}
		case 'return': {
			result.expr = visitNode(result.expr) as Ast.Return['expr'];
			break;
		}
		case 'forOf': {
			result.items = visitNode(result.items) as Ast.Each['items'];
			result.for = visitNode(result.for) as Ast.Each['for'];
			break;
		}
		case 'for': {
			if (result.from != null) {
				result.from = visitNode(result.from) as Ast.For['from'];
			}
			if (result.to != null) {
				result.to = visitNode(result.to) as Ast.For['to'];
			}
			if (result.times != null) {
				result.times = visitNode(result.times) as Ast.For['times'];
			}
			result.for = visitNode(result.for) as Ast.Each['for'];
			break;
		}
		case 'loop': {
			visitNodes(result.statements);
			break;
		}
		case 'inc':
		case 'dec':
		case 'assign': {
			result.expr = visitNode(result.expr) as Ast.Assign['expr'];
			result.dest = visitNode(result.dest) as Ast.Assign['dest'];
			break;
		}
		case 'infix': {
			visitNodes(result.operands);
			break;
		}
		case 'if': {
			result.cond = visitNode(result.cond) as Ast.If['cond'];
			result.then = visitNode(result.then) as Ast.If['then'];
			for (const prop of result.elseif) {
				prop.cond = visitNode(prop.cond) as Ast.If['elseif'][number]['cond'];
				prop.then = visitNode(prop.then) as Ast.If['elseif'][number]['then'];
			}
			if (result.else != null) {
				result.else = visitNode(result.else) as Ast.If['else'];
			}
			break;
		}
		case 'fn': {
			visitNodes(result.children);
			break;
		}
		case 'match': {
			result.about = visitNode(result.about) as Ast.Match['about'];
			for (const prop of result.qs) {
				prop.q = visitNode(prop.q) as Ast.Match['qs'][number]['q'];
				prop.a = visitNode(prop.a) as Ast.Match['qs'][number]['a'];
			}
			if (result.default != null) {
				result.default = visitNode(result.default) as Ast.Match['default'];
			}
			break;
		}
		case 'block': {
			visitNodes(result.statements);
			break;
		}
		case 'tmpl': {
			for (let i = 0; i < result.tmpl.length; i++) {
				if (typeof result.tmpl[i] !== 'string') {
					result.tmpl[i] = visitNode(result.tmpl[i] as Ast.Expression) as Ast.Expression;
				}
			}
			break;
		}
		case 'obj': {
			for (const item of result.value) {
				result.value.set(item[0], visitNode(item[1]) as any);
			}
			break;
		}
		case 'arr': {
			visitNodes(result.value);
			break;
		}
		case 'call': {
			result.target = visitNode(result.target) as Ast.Call['target'];
			visitNodes(result.args);
			break;
		}
		case 'index': {
			result.target = visitNode(result.target) as Ast.Index['target'];
			result.index = visitNode(result.index) as Ast.Index['index'];
			break;
		}
		case 'prop': {
			result.target = visitNode(result.target) as Ast.Prop['target'];
			break;
		}
	}

	return result;
}

function visitNodes(nodes: Ast.Node[]) {
	for (let i = 0; i < nodes.length; i++) {
		nodes[i] = visitNode(nodes[i]);
	}
}

export function transformChain(nodes: Ast.Node[]): Ast.Node[] {
	visitNodes(nodes);
	return nodes;
}
