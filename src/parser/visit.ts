import type * as Ast from '../node.js';

export function visitNode(node: Ast.Node, fn: (node: Ast.Node, ancestors: Ast.Node[]) => Ast.Node): Ast.Node {
	return visitNodeInner(node, fn, []);
}

function visitNodeInner(node: Ast.Node, fn: (node: Ast.Node, ancestors: Ast.Node[]) => Ast.Node, ancestors: Ast.Node[]): Ast.Node {
	const result = fn(node, ancestors);
	ancestors.push(node);

	// nested nodes
	switch (result.type) {
		case 'def': {
			result.expr = visitNodeInner(result.expr, fn, ancestors) as Ast.Definition['expr'];
			break;
		}
		case 'return': {
			result.expr = visitNodeInner(result.expr, fn, ancestors) as Ast.Return['expr'];
			break;
		}
		case 'each': {
			result.items = visitNodeInner(result.items, fn, ancestors) as Ast.Each['items'];
			result.for = visitNodeInner(result.for, fn, ancestors) as Ast.Each['for'];
			break;
		}
		case 'for': {
			if (result.from != null) {
				result.from = visitNodeInner(result.from, fn, ancestors) as Ast.For['from'];
			}
			if (result.to != null) {
				result.to = visitNodeInner(result.to, fn, ancestors) as Ast.For['to'];
			}
			if (result.times != null) {
				result.times = visitNodeInner(result.times, fn, ancestors) as Ast.For['times'];
			}
			result.for = visitNodeInner(result.for, fn, ancestors) as Ast.For['for'];
			break;
		}
		case 'loop': {
			for (let i = 0; i < result.statements.length; i++) {
				result.statements[i] = visitNodeInner(result.statements[i]!, fn, ancestors) as Ast.Loop['statements'][number];
			}
			break;
		}
		case 'addAssign':
		case 'subAssign':
		case 'assign': {
			result.expr = visitNodeInner(result.expr, fn, ancestors) as Ast.Assign['expr'];
			result.dest = visitNodeInner(result.dest, fn, ancestors) as Ast.Assign['dest'];
			break;
		}
		case 'plus': {
			result.expr = visitNodeInner(result.expr, fn, ancestors) as Ast.Plus['expr'];
			break;
		}
		case 'minus': {
			result.expr = visitNodeInner(result.expr, fn, ancestors) as Ast.Minus['expr'];
			break;
		}
		case 'not': {
			result.expr = visitNodeInner(result.expr, fn, ancestors) as Ast.Not['expr'];
			break;
		}
		case 'if': {
			result.cond = visitNodeInner(result.cond, fn, ancestors) as Ast.If['cond'];
			result.then = visitNodeInner(result.then, fn, ancestors) as Ast.If['then'];
			for (const prop of result.elseif) {
				prop.cond = visitNodeInner(prop.cond, fn, ancestors) as Ast.If['elseif'][number]['cond'];
				prop.then = visitNodeInner(prop.then, fn, ancestors) as Ast.If['elseif'][number]['then'];
			}
			if (result.else != null) {
				result.else = visitNodeInner(result.else, fn, ancestors) as Ast.If['else'];
			}
			break;
		}
		case 'fn': {
			for (const param of result.params) {
				if (param.default) {
					param.default = visitNodeInner(param.default!, fn, ancestors) as Ast.Fn['params'][number]['default'];
				}
			}
			for (let i = 0; i < result.children.length; i++) {
				result.children[i] = visitNodeInner(result.children[i]!, fn, ancestors) as Ast.Fn['children'][number];
			}
			break;
		}
		case 'match': {
			result.about = visitNodeInner(result.about, fn, ancestors) as Ast.Match['about'];
			for (const prop of result.qs) {
				prop.q = visitNodeInner(prop.q, fn, ancestors) as Ast.Match['qs'][number]['q'];
				prop.a = visitNodeInner(prop.a, fn, ancestors) as Ast.Match['qs'][number]['a'];
			}
			if (result.default != null) {
				result.default = visitNodeInner(result.default, fn, ancestors) as Ast.Match['default'];
			}
			break;
		}
		case 'block': {
			for (let i = 0; i < result.statements.length; i++) {
				result.statements[i] = visitNodeInner(result.statements[i]!, fn, ancestors) as Ast.Block['statements'][number];
			}
			break;
		}
		case 'exists': {
			result.identifier = visitNodeInner(result.identifier, fn, ancestors) as Ast.Exists['identifier'];
			break;
		}
		case 'tmpl': {
			for (let i = 0; i < result.tmpl.length; i++) {
				const item = result.tmpl[i]!;
				if (typeof item !== 'string') {
					result.tmpl[i] = visitNodeInner(item, fn, ancestors) as Ast.Tmpl['tmpl'][number];
				}
			}
			break;
		}
		case 'obj': {
			for (const item of result.value) {
				result.value.set(item[0], visitNodeInner(item[1], fn, ancestors) as Ast.Expression);
			}
			break;
		}
		case 'arr': {
			for (let i = 0; i < result.value.length; i++) {
				result.value[i] = visitNodeInner(result.value[i]!, fn, ancestors) as Ast.Arr['value'][number];
			}
			break;
		}
		case 'call': {
			result.target = visitNodeInner(result.target, fn, ancestors) as Ast.Call['target'];
			for (let i = 0; i < result.args.length; i++) {
				result.args[i] = visitNodeInner(result.args[i]!, fn, ancestors) as Ast.Call['args'][number];
			}
			break;
		}
		case 'index': {
			result.target = visitNodeInner(result.target, fn, ancestors) as Ast.Index['target'];
			result.index = visitNodeInner(result.index, fn, ancestors) as Ast.Index['index'];
			break;
		}
		case 'prop': {
			result.target = visitNodeInner(result.target, fn, ancestors) as Ast.Prop['target'];
			break;
		}
		case 'ns': {
			for (let i = 0; i < result.members.length; i++) {
				result.members[i] = visitNodeInner(result.members[i]!, fn, ancestors) as (typeof result.members)[number];
			}
			break;
		}

		case 'pow':
		case 'mul':
		case 'div':
		case 'rem':
		case 'add':
		case 'sub':
		case 'lt':
		case 'lteq':
		case 'gt':
		case 'gteq':
		case 'eq':
		case 'neq':
		case 'and':
		case 'or': {
			result.left = visitNodeInner(result.left, fn, ancestors) as (
				Ast.Pow |
				Ast.Mul |
				Ast.Div |
				Ast.Rem |
				Ast.Add |
				Ast.Sub |
				Ast.Lt |
				Ast.Lteq |
				Ast.Gt |
				Ast.Gteq |
				Ast.Eq |
				Ast.Neq |
				Ast.And |
				Ast.Or
			)['left'];
			result.right = visitNodeInner(result.right, fn, ancestors) as (
				Ast.Pow |
				Ast.Mul |
				Ast.Div |
				Ast.Rem |
				Ast.Add |
				Ast.Sub |
				Ast.Lt |
				Ast.Lteq |
				Ast.Gt |
				Ast.Gteq |
				Ast.Eq |
				Ast.Neq |
				Ast.And |
				Ast.Or
			)['right'];
			break;
		}
	}

	ancestors.pop();
	return result;
}
