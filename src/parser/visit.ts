import * as Ast from './node';

export function visitNode(node: Ast.Node, fn: (node: Ast.Node) => Ast.Node): Ast.Node {
	const result = fn(node);

	// nested nodes
	switch (result.type) {
		case 'def': {
			result.expr = visitNode(result.expr, fn) as Ast.Definition['expr'];
			break;
		}
		case 'return': {
			result.expr = visitNode(result.expr, fn) as Ast.Return['expr'];
			break;
		}
		case 'forOf': {
			result.items = visitNode(result.items, fn) as Ast.Each['items'];
			result.for = visitNode(result.for, fn) as Ast.Each['for'];
			break;
		}
		case 'for': {
			if (result.from != null) {
				result.from = visitNode(result.from, fn) as Ast.For['from'];
			}
			if (result.to != null) {
				result.to = visitNode(result.to, fn) as Ast.For['to'];
			}
			if (result.times != null) {
				result.times = visitNode(result.times, fn) as Ast.For['times'];
			}
			result.for = visitNode(result.for, fn) as Ast.For['for'];
			break;
		}
		case 'loop': {
			for (let i = 0; i < result.statements.length; i++) {
				result.statements[i] = visitNode(result.statements[i], fn) as Ast.Loop['statements'][number];
			}
			break;
		}
		case 'inc':
		case 'dec':
		case 'assign': {
			result.expr = visitNode(result.expr, fn) as Ast.Assign['expr'];
			result.dest = visitNode(result.dest, fn) as Ast.Assign['dest'];
			break;
		}
		case 'infix': {
			for (let i = 0; i < result.operands.length; i++) {
				result.operands[i] = visitNode(result.operands[i], fn) as Ast.Infix['operands'][number];
			}
			break;
		}
		case 'if': {
			result.cond = visitNode(result.cond, fn) as Ast.If['cond'];
			result.then = visitNode(result.then, fn) as Ast.If['then'];
			for (const prop of result.elseif) {
				prop.cond = visitNode(prop.cond, fn) as Ast.If['elseif'][number]['cond'];
				prop.then = visitNode(prop.then, fn) as Ast.If['elseif'][number]['then'];
			}
			if (result.else != null) {
				result.else = visitNode(result.else, fn) as Ast.If['else'];
			}
			break;
		}
		case 'fn': {
			for (let i = 0; i < result.children.length; i++) {
				result.children[i] = visitNode(result.children[i], fn) as Ast.Fn['children'][number];
			}
			break;
		}
		case 'match': {
			result.about = visitNode(result.about, fn) as Ast.Match['about'];
			for (const prop of result.qs) {
				prop.q = visitNode(prop.q, fn) as Ast.Match['qs'][number]['q'];
				prop.a = visitNode(prop.a, fn) as Ast.Match['qs'][number]['a'];
			}
			if (result.default != null) {
				result.default = visitNode(result.default, fn) as Ast.Match['default'];
			}
			break;
		}
		case 'block': {
			for (let i = 0; i < result.statements.length; i++) {
				result.statements[i] = visitNode(result.statements[i], fn) as Ast.Block['statements'][number];
			}
			break;
		}
		case 'tmpl': {
			for (let i = 0; i < result.tmpl.length; i++) {
				const item = result.tmpl[i];
				if (typeof item !== 'string') {
					result.tmpl[i] = visitNode(item, fn) as Ast.Tmpl['tmpl'][number];
				}
			}
			break;
		}
		case 'obj': {
			for (const item of result.value) {
				result.value.set(item[0], visitNode(item[1], fn) as Ast.Expression);
			}
			break;
		}
		case 'arr': {
			for (let i = 0; i < result.value.length; i++) {
				result.value[i] = visitNode(result.value[i], fn) as Ast.Arr['value'][number];
			}
			break;
		}
		case 'callChain': {
			for (let i = 0; i < result.args.length; i++) {
				result.args[i] = visitNode(result.args[i], fn) as Ast.Call['args'][number];
			}
			break;
		}
		case 'indexChain': {
			result.index = visitNode(result.index, fn) as Ast.Index['index'];
			break;
		}
		case 'call': {
			result.target = visitNode(result.target, fn) as Ast.Call['target'];
			for (let i = 0; i < result.args.length; i++) {
				result.args[i] = visitNode(result.args[i], fn) as Ast.Call['args'][number];
			}
			break;
		}
		case 'index': {
			result.target = visitNode(result.target, fn) as Ast.Index['target'];
			result.index = visitNode(result.index, fn) as Ast.Index['index'];
			break;
		}
		case 'prop': {
			result.target = visitNode(result.target, fn) as Ast.Prop['target'];
			break;
		}
	}

	if (Ast.hasChainProp(result)) {
		if (result.chain != null) {
			for (let i = 0; i < result.chain.length; i++) {
				result.chain[i] = visitNode(result.chain[i], fn) as Ast.ChainMember;
			}
		}
	}

	return result;
}
