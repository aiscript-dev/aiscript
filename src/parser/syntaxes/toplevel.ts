import { NODE } from '../utils.js';
import { TokenKind } from '../token.js';
import { AiScriptSyntaxError } from '../../error.js';
import { parseDefStatement, parseStatement } from './statements.js';
import { parseExpr } from './expressions.js';

import type * as Ast from '../../node.js';
import type { ITokenStream } from '../streams/token-stream.js';

/**
 * ```abnf
 * TopLevel = *(Namespace / Meta / Statement)
 * ```
*/
export function parseTopLevel(s: ITokenStream): Ast.Node[] {
	const nodes: Ast.Node[] = [];

	while (s.is(TokenKind.NewLine)) {
		s.next();
	}

	while (!s.is(TokenKind.EOF)) {
		switch (s.getToken().kind) {
			case TokenKind.Colon2: {
				nodes.push(parseNamespace(s));
				break;
			}
			case TokenKind.Sharp3: {
				nodes.push(parseMeta(s));
				break;
			}
			default: {
				nodes.push(parseStatement(s));
				break;
			}
		}

		// terminator
		switch (s.getToken().kind) {
			case TokenKind.NewLine:
			case TokenKind.SemiColon: {
				while ([TokenKind.NewLine, TokenKind.SemiColon].includes(s.getToken().kind)) {
					s.next();
				}
				break;
			}
			case TokenKind.EOF: {
				break;
			}
			default: {
				throw new AiScriptSyntaxError('Multiple statements cannot be placed on a single line.', s.getPos());
			}
		}
	}

	return nodes;
}

/**
 * ```abnf
 * Namespace = "::" IDENT "{" *(VarDef / FnDef / Namespace) "}"
 * ```
*/
export function parseNamespace(s: ITokenStream): Ast.Node {
	const startPos = s.getPos();

	s.expect(TokenKind.Colon2);
	s.next();

	s.expect(TokenKind.Identifier);
	const name = s.getValue();
	s.next();

	const members: Ast.Node[] = [];
	s.expect(TokenKind.OpenBrace);
	s.next();

	while (s.is(TokenKind.NewLine)) {
		s.next();
	}

	while (!s.is(TokenKind.CloseBrace)) {
		switch (s.getToken().kind) {
			case TokenKind.VarKeyword:
			case TokenKind.LetKeyword:
			case TokenKind.At: {
				members.push(parseDefStatement(s));
				break;
			}
			case TokenKind.Colon2: {
				members.push(parseNamespace(s));
				break;
			}
		}

		// terminator
		switch (s.getToken().kind) {
			case TokenKind.NewLine:
			case TokenKind.SemiColon: {
				while ([TokenKind.NewLine, TokenKind.SemiColon].includes(s.getToken().kind)) {
					s.next();
				}
				break;
			}
			case TokenKind.CloseBrace: {
				break;
			}
			default: {
				throw new AiScriptSyntaxError('Multiple statements cannot be placed on a single line.', s.getPos());
			}
		}
	}
	s.expect(TokenKind.CloseBrace);
	s.next();

	return NODE('ns', { name, members }, startPos, s.getPos());
}

/**
 * ```abnf
 * Meta = "###" [IDENT] StaticExpr
 * ```
*/
export function parseMeta(s: ITokenStream): Ast.Node {
	const startPos = s.getPos();

	s.expect(TokenKind.Sharp3);
	s.next();

	let name = null;
	if (s.is(TokenKind.Identifier)) {
		name = s.getValue();
		s.next();
	}

	const value = parseExpr(s, true);

	return NODE('meta', { name, value }, startPos, value.loc.end);
}
