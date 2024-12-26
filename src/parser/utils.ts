import { AiScriptSyntaxError, AiScriptUnexpectedEOFError } from '../error.js';
import { TokenKind } from './token.js';
import type { AiScriptError } from '../error.js';
import type * as Ast from '../node.js';

export function NODE<T extends Ast.Node['type']>(
	type: T,
	params: Omit<Extract<Ast.Node, { type: T }>, 'type' | 'loc'>,
	start: Ast.Pos,
	end: Ast.Pos,
): Extract<Ast.Node, { type: T }> {
	return { type, ...params, loc: { start, end } } as Extract<Ast.Node, { type: T }>;
}

export function LOC(start: Ast.Pos, end: Ast.Pos): Ast.Loc {
	return { start, end };
}

export function CALL_NODE(
	name: string,
	args: Ast.Expression[],
	start: Ast.Pos,
	end: Ast.Pos,
): Ast.Call {
	return NODE('call', {
		// 糖衣構文はidentifierがソースコードに出現しないので長さ0とする。
		target: NODE('identifier', { name }, start, start),
		args,
	}, start, end);
}

export function unexpectedTokenError(token: TokenKind, pos: Ast.Pos, info?: unknown): AiScriptError {
	if (token === TokenKind.EOF) {
		return new AiScriptUnexpectedEOFError(pos, info);
	} else {
		return new AiScriptSyntaxError(`unexpected token: ${TokenKind[token]}`, pos, info);
	}
}
