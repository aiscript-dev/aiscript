import type * as Ast from '../node.js';

export function visitNode<T extends Ast.Node>(node: T, fn: <T extends Ast.Node>(node: T, ancestors: Ast.Node[]) => T): T {
	return visitNodeInner(node, fn, []);
}

function visitNodeInner<T extends Ast.Node>(node: T, fn: <T extends Ast.Node>(node: T, ancestors: Ast.Node[]) => T, ancestors: Ast.Node[]): T {
	const result = fn(node, ancestors);
	ancestors.push(node);

	// nested nodes
	switch (result.type) {
		case 'def': {
			if (result.varType != null) {
				result.varType = visitNodeInner(result.varType, fn, ancestors);
			}
			result.attr = result.attr.map((attr) => visitNodeInner(attr, fn, ancestors));
			result.expr = visitNodeInner(result.expr, fn, ancestors);
			break;
		}
		case 'return': {
			result.expr = visitNodeInner(result.expr, fn, ancestors);
			break;
		}
		case 'each': {
			result.items = visitNodeInner(result.items, fn, ancestors);
			result.for = visitNodeInner(result.for, fn, ancestors);
			break;
		}
		case 'for': {
			if (result.from != null) {
				result.from = visitNodeInner(result.from, fn, ancestors);
			}
			if (result.to != null) {
				result.to = visitNodeInner(result.to, fn, ancestors);
			}
			if (result.times != null) {
				result.times = visitNodeInner(result.times, fn, ancestors);
			}
			result.for = visitNodeInner(result.for, fn, ancestors);
			break;
		}
		case 'loop': {
			for (let i = 0; i < result.statements.length; i++) {
				result.statements[i] = visitNodeInner(result.statements[i]!, fn, ancestors);
			}
			break;
		}
		case 'addAssign':
		case 'subAssign':
		case 'assign': {
			result.expr = visitNodeInner(result.expr, fn, ancestors);
			result.dest = visitNodeInner(result.dest, fn, ancestors);
			break;
		}
		case 'plus': {
			result.expr = visitNodeInner(result.expr, fn, ancestors);
			break;
		}
		case 'minus': {
			result.expr = visitNodeInner(result.expr, fn, ancestors);
			break;
		}
		case 'not': {
			result.expr = visitNodeInner(result.expr, fn, ancestors);
			break;
		}
		case 'if': {
			result.cond = visitNodeInner(result.cond, fn, ancestors);
			result.then = visitNodeInner(result.then, fn, ancestors);
			for (const prop of result.elseif) {
				prop.cond = visitNodeInner(prop.cond, fn, ancestors);
				prop.then = visitNodeInner(prop.then, fn, ancestors);
			}
			if (result.else != null) {
				result.else = visitNodeInner(result.else, fn, ancestors);
			}
			break;
		}
		case 'fn': {
			for (const param of result.params) {
				if (param.default) {
					param.default = visitNodeInner(param.default!, fn, ancestors);
				}
				if (param.argType != null) {
					param.argType = visitNodeInner(param.argType, fn, ancestors);
				}
			}
			if (result.retType != null) {
				result.retType = visitNodeInner(result.retType, fn, ancestors);
			}
			for (let i = 0; i < result.children.length; i++) {
				result.children[i] = visitNodeInner(result.children[i]!, fn, ancestors);
			}
			break;
		}
		case 'match': {
			result.about = visitNodeInner(result.about, fn, ancestors);
			for (const prop of result.qs) {
				prop.q = visitNodeInner(prop.q, fn, ancestors);
				prop.a = visitNodeInner(prop.a, fn, ancestors);
			}
			if (result.default != null) {
				result.default = visitNodeInner(result.default, fn, ancestors);
			}
			break;
		}
		case 'block': {
			for (let i = 0; i < result.statements.length; i++) {
				result.statements[i] = visitNodeInner(result.statements[i]!, fn, ancestors);
			}
			break;
		}
		case 'exists': {
			result.identifier = visitNodeInner(result.identifier, fn, ancestors);
			break;
		}
		case 'tmpl': {
			for (let i = 0; i < result.tmpl.length; i++) {
				const item = result.tmpl[i]!;
				if (typeof item !== 'string') {
					result.tmpl[i] = visitNodeInner(item, fn, ancestors);
				}
			}
			break;
		}
		case 'obj': {
			for (const item of result.value) {
				result.value.set(item[0], visitNodeInner(item[1], fn, ancestors));
			}
			break;
		}
		case 'arr': {
			for (let i = 0; i < result.value.length; i++) {
				result.value[i] = visitNodeInner(result.value[i]!, fn, ancestors);
			}
			break;
		}
		case 'call': {
			result.target = visitNodeInner(result.target, fn, ancestors);
			for (let i = 0; i < result.args.length; i++) {
				result.args[i] = visitNodeInner(result.args[i]!, fn, ancestors);
			}
			break;
		}
		case 'index': {
			result.target = visitNodeInner(result.target, fn, ancestors);
			result.index = visitNodeInner(result.index, fn, ancestors);
			break;
		}
		case 'prop': {
			result.target = visitNodeInner(result.target, fn, ancestors);
			break;
		}
		case 'ns': {
			for (let i = 0; i < result.members.length; i++) {
				result.members[i] = visitNodeInner(result.members[i]!, fn, ancestors);
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
			result.left = visitNodeInner(result.left, fn, ancestors);
			result.right = visitNodeInner(result.right, fn, ancestors);
			break;
		}

		case 'fnTypeSource': {
			for (let i = 0; i < result.params.length; i++) {
				result.params[i] = visitNodeInner(result.params[i]!, fn, ancestors);
			}
			break;
		}
		case 'unionTypeSource': {
			for (let i = 0; i < result.inners.length; i++) {
				result.inners[i] = visitNodeInner(result.inners[i]!, fn, ancestors);
			}
			break;
		}
	}

	ancestors.pop();
	return result;
}
