import type * as Ast from '../node.js';

export function NODE(type: string, params: Record<string, any>, start: Ast.Pos, end: Ast.Pos): Ast.Node {
	const node: Record<string, any> = { type };
	for (const key of Object.keys(params)) {
		if (params[key] !== undefined) {
			node[key] = params[key];
		}
	}
	node.loc = { start, end };
	return node as Ast.Node;
}

export function CALL_NODE(name: string, args: Ast.Node[], start: Ast.Pos, end: Ast.Pos): Ast.Node {
	return NODE('call', {
		// 糖衣構文はidentifierがソースコードに出現しないので長さ0とする。
		target: NODE('identifier', { name }, start, start),
		args,
	}, start, end);
}
