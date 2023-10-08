import type * as Ast from '../node.js';

export function NODE(type: string, params: Record<string, any>, loc: { column: number, line: number }): Ast.Node {
	const node: Record<string, any> = { type };
	for (const key of Object.keys(params)) {
		if (params[key] !== undefined) {
			node[key] = params[key];
		}
	}
	node.loc = loc;
	return node as Ast.Node;
}

export function CALL_NODE(name: string, args: Ast.Node[], loc: { column: number, line: number }): Ast.Node {
	return NODE('call', {
		target: NODE('identifier', { name }, loc),
		args,
	}, loc);
}
