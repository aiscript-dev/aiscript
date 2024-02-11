import * as Ast from '../node.js';

export function CALL_NODE(name: string, args: Ast.Expression[], loc: { column: number, line: number }): Ast.Call {
	return new Ast.Call(
		new Ast.Identifier(name, loc), args, loc
	);
}
