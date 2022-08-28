import * as Ast from '../node';

function visitNode(node: Ast.Expression): Ast.Expression
function visitNode(node: Ast.Statement): Ast.Statement
function visitNode(node: Ast.Statement | Ast.Expression): Ast.Statement | Ast.Expression
function visitNode(node: Ast.Node): Ast.Node
function visitNode(node: Ast.Node): Ast.Node {
	let result: Ast.Node = node;

	// transform chain
	if (Ast.hasChainProp(node) && node.chain != null) {
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
		result = parent;
	}

	// nested nodes
	switch (result.type) {
		case 'def': {
			result.expr = visitNode(result.expr);
			break;
		}
		case 'return': {
			result.expr = visitNode(result.expr);
			break;
		}
		case 'forOf': {
			result.items = visitNode(result.items);
			result.for = visitNode(result.for);
			break;
		}
		case 'for': {
			if (result.from != null) {
				result.from = visitNode(result.from);
			}
			if (result.to != null) {
				result.to = visitNode(result.to);
			}
			if (result.times != null) {
				result.times = visitNode(result.times);
			}
			result.for = visitNode(result.for);
			break;
		}
		case 'loop': {
			visitNodes(result.statements);
			break;
		}
		case 'inc':
		case 'dec':
		case 'assign': {
			result.expr = visitNode(result.expr);
			result.dest = visitNode(result.dest);
			break;
		}
		case 'infix': {
			visitNodes(result.operands);
			break;
		}
		case 'if': {
			result.cond = visitNode(result.cond);
			result.then = visitNode(result.then);
			for (const prop of result.elseif) {
				prop.cond = visitNode(prop.cond);
				prop.then = visitNode(prop.then);
			}
			if (result.else != null) {
				result.else = visitNode(result.else);
			}
			break;
		}
		case 'fn': {
			visitNodes(result.children);
			break;
		}
		case 'match': {
			result.about = visitNode(result.about);
			for (const prop of result.qs) {
				prop.q = visitNode(prop.q);
				prop.a = visitNode(prop.a);
			}
			if (result.default != null) {
				result.default = visitNode(result.default);
			}
			break;
		}
		case 'block': {
			visitNodes(result.statements);
			break;
		}
		case 'tmpl': {
			for (let i = 0; i < result.tmpl.length; i++) {
				const item = result.tmpl[i];
				if (typeof item !== 'string') {
					result.tmpl[i] = visitNode(item);
				}
			}
			break;
		}
		case 'obj': {
			for (const item of result.value) {
				result.value.set(item[0], visitNode(item[1]));
			}
			break;
		}
		case 'arr': {
			visitNodes(result.value);
			break;
		}
		case 'call': {
			result.target = visitNode(result.target);
			visitNodes(result.args);
			break;
		}
		case 'index': {
			result.target = visitNode(result.target);
			result.index = visitNode(result.index);
			break;
		}
		case 'prop': {
			result.target = visitNode(result.target);
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
