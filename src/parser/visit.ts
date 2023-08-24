import * as Cst from './node.js';

export function visitNode(node: Cst.Node, fn: (node: Cst.Node) => Cst.Node): Cst.Node {
	const result = fn(node);

	// nested nodes
	switch (result.type) {
		case 'def': {
			result.expr = visitNode(result.expr, fn) as Cst.Definition['expr'];
			break;
		}
		case 'return': {
			result.expr = visitNode(result.expr, fn) as Cst.Return['expr'];
			break;
		}
		case 'each': {
			result.items = visitNode(result.items, fn) as Cst.Each['items'];
			result.for = visitNode(result.for, fn) as Cst.Each['for'];
			break;
		}
		case 'for': {
			if (result.from != null) {
				result.from = visitNode(result.from, fn) as Cst.For['from'];
			}
			if (result.to != null) {
				result.to = visitNode(result.to, fn) as Cst.For['to'];
			}
			if (result.times != null) {
				result.times = visitNode(result.times, fn) as Cst.For['times'];
			}
			result.for = visitNode(result.for, fn) as Cst.For['for'];
			break;
		}
		case 'loop': {
			for (let i = 0; i < result.statements.length; i++) {
				result.statements[i] = visitNode(result.statements[i]!, fn) as Cst.Loop['statements'][number];
			}
			break;
		}
		case 'addAssign':
		case 'subAssign':
		case 'assign': {
			result.expr = visitNode(result.expr, fn) as Cst.Assign['expr'];
			result.dest = visitNode(result.dest, fn) as Cst.Assign['dest'];
			break;
		}
		case 'infix': {
			for (let i = 0; i < result.operands.length; i++) {
				result.operands[i] = visitNode(result.operands[i]!, fn) as Cst.Infix['operands'][number];
			}
			break;
		}
		case 'not': {
			result.expr = visitNode(result.expr, fn) as Cst.Return['expr'];
			break;
		}
		case 'if': {
			result.cond = visitNode(result.cond, fn) as Cst.If['cond'];
			result.then = visitNode(result.then, fn) as Cst.If['then'];
			for (const prop of result.elseif) {
				prop.cond = visitNode(prop.cond, fn) as Cst.If['elseif'][number]['cond'];
				prop.then = visitNode(prop.then, fn) as Cst.If['elseif'][number]['then'];
			}
			if (result.else != null) {
				result.else = visitNode(result.else, fn) as Cst.If['else'];
			}
			break;
		}
		case 'fn': {
			for (let i = 0; i < result.children.length; i++) {
				result.children[i] = visitNode(result.children[i]!, fn) as Cst.Fn['children'][number];
			}
			break;
		}
		case 'match': {
			result.about = visitNode(result.about, fn) as Cst.Match['about'];
			for (const prop of result.qs) {
				prop.q = visitNode(prop.q, fn) as Cst.Match['qs'][number]['q'];
				prop.a = visitNode(prop.a, fn) as Cst.Match['qs'][number]['a'];
			}
			if (result.default != null) {
				result.default = visitNode(result.default, fn) as Cst.Match['default'];
			}
			break;
		}
		case 'block': {
			for (let i = 0; i < result.statements.length; i++) {
				result.statements[i] = visitNode(result.statements[i]!, fn) as Cst.Block['statements'][number];
			}
			break;
		}
		case 'tmpl': {
			for (let i = 0; i < result.tmpl.length; i++) {
				const item = result.tmpl[i]!;
				if (typeof item !== 'string') {
					result.tmpl[i] = visitNode(item, fn) as Cst.Tmpl['tmpl'][number];
				}
			}
			break;
		}
		case 'obj': {
			for (const item of result.value) {
				result.value.set(item[0], visitNode(item[1], fn) as Cst.Expression);
			}
			break;
		}
		case 'arr': {
			for (let i = 0; i < result.value.length; i++) {
				result.value[i] = visitNode(result.value[i]!, fn) as Cst.Arr['value'][number];
			}
			break;
		}
		case 'callChain': {
			for (let i = 0; i < result.args.length; i++) {
				result.args[i] = visitNode(result.args[i]!, fn) as Cst.Call['args'][number];
			}
			break;
		}
		case 'indexChain': {
			result.index = visitNode(result.index, fn) as Cst.Index['index'];
			break;
		}
		case 'call': {
			result.target = visitNode(result.target, fn) as Cst.Call['target'];
			for (let i = 0; i < result.args.length; i++) {
				result.args[i] = visitNode(result.args[i]!, fn) as Cst.Call['args'][number];
			}
			break;
		}
		case 'index': {
			result.target = visitNode(result.target, fn) as Cst.Index['target'];
			result.index = visitNode(result.index, fn) as Cst.Index['index'];
			break;
		}
		case 'prop': {
			result.target = visitNode(result.target, fn) as Cst.Prop['target'];
			break;
		}
		case 'ns': {
			for (let i = 0; i < result.members.length; i++) {
				result.members[i] = visitNode(result.members[i]!, fn) as (typeof result.members)[number];
			}
			break;
		}

		case 'or':
		case 'and': {
			result.left = visitNode(result.left, fn) as (Cst.And | Cst.Or)['left'];
			result.right = visitNode(result.right, fn) as (Cst.And | Cst.Or)['right'];
			break;
		}
	}

	if (Cst.hasChainProp(result)) {
		if (result.chain != null) {
			for (let i = 0; i < result.chain.length; i++) {
				result.chain[i] = visitNode(result.chain[i]!, fn) as Cst.ChainMember;
			}
		}
	}

	return result;
}
