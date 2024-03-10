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

	while (s.getKind() === TokenKind.NewLine) {
		s.next();
	}

	while (s.getKind() !== TokenKind.EOF) {
		switch (s.getKind()) {
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
		switch (s.getKind() as TokenKind) {
			case TokenKind.NewLine:
			case TokenKind.SemiColon: {
				while ([TokenKind.NewLine, TokenKind.SemiColon].includes(s.getKind())) {
					s.next();
				}
				break;
			}
			case TokenKind.EOF: {
				break;
			}
			default: {
				throw new AiScriptSyntaxError('Multiple statements cannot be placed on a single line.', s.token.loc);
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
	const loc = s.token.loc;

	s.nextWith(TokenKind.Colon2);

	s.expect(TokenKind.Identifier);
	const name = s.token.value!;
	s.next();

	const members: Ast.Node[] = [];
	s.nextWith(TokenKind.OpenBrace);

	while (s.getKind() === TokenKind.NewLine) {
		s.next();
	}

	while (s.getKind() !== TokenKind.CloseBrace) {
		switch (s.getKind()) {
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
		switch (s.getKind() as TokenKind) {
			case TokenKind.NewLine:
			case TokenKind.SemiColon: {
				while ([TokenKind.NewLine, TokenKind.SemiColon].includes(s.getKind())) {
					s.next();
				}
				break;
			}
			case TokenKind.CloseBrace: {
				break;
			}
			default: {
				throw new AiScriptSyntaxError('Multiple statements cannot be placed on a single line.', s.token.loc);
			}
		}
	}
	s.nextWith(TokenKind.CloseBrace);

	return NODE('ns', { name, members }, loc);
}

/**
 * ```abnf
 * Meta = "###" [IDENT] StaticExpr
 * ```
*/
export function parseMeta(s: ITokenStream): Ast.Node {
	const loc = s.token.loc;

	s.nextWith(TokenKind.Sharp3);

	let name = null;
	if (s.getKind() === TokenKind.Identifier) {
		name = s.token.value!;
		s.next();
	}

	const value = parseExpr(s, true);

	return NODE('meta', { name, value }, loc);
}
