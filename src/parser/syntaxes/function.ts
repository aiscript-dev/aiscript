import { AiScriptSyntaxError } from '../../error.js';
import { TokenKind } from '../token.js';
import { TokenStream } from '../streams/token-stream.js';
import type { ITokenStream } from '../streams/token-stream.js';
import { NODE } from '../node.js';
import type * as Cst from '../node.js';
import { parseBlock } from './common.js';

/**
 * ```abnf
 * FnDef = "@" IDENT "(" Params ")" [":" Type] Block
 * ```
*/
export function parseFnDef(s: ITokenStream): Cst.Node {
	s.nextWith(TokenKind.At);

	s.expect(TokenKind.Identifier);
	const name = s.token.value;
	s.next();

	s.nextWith(TokenKind.OpenParen);

	const params = parseParams(s);

	s.nextWith(TokenKind.CloseParen);

	// type

	const body = parseBlock(s);

	return NODE('def', {
		name,
		expr: NODE('fn', { args: params ?? [], retType: undefined, children: body ?? [] }),
		mut: false,
		attr: []
	});
}

/**
 * ```abnf
 * FnExpr = "@(" Params ")" [":" Type] Block
 * ```
*/
export function parseFnExpr(s: ITokenStream): Cst.Node {
	s.nextWith(TokenKind.OpenAtParen);

	const params = parseParams(s);

	s.nextWith(TokenKind.CloseParen);

	// type

	const body = parseBlock(s);

	return NODE('fn', { args: params ?? [], retType: undefined, children: body ?? [] });
}

function parseParams(s: ITokenStream): Cst.Node[] {
	throw new Error('todo');
}
