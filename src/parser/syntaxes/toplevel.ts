import { TokenKind } from '../token.js';
import { AiScriptSyntaxError } from '../../error.js';
import { parseDefStatement, parseStatement } from './statements.js';
import { parseExpr } from './expressions.js';
import * as Ast from '../../node.js';

import type { ITokenStream } from '../streams/token-stream.js';

/**
 * ```abnf
 * TopLevel = *(Namespace / Meta / Statement)
 * ```
*/
export function parseTopLevel(s: ITokenStream): Ast.Node[] {
	const nodes: Ast.Node[] = [];

	while (s.kind === TokenKind.NewLine) {
		s.next();
	}

	while (s.kind !== TokenKind.EOF) {
		switch (s.kind) {
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

		if ((s.kind as TokenKind) !== TokenKind.NewLine && (s.kind as TokenKind) !== TokenKind.EOF) {
			throw new AiScriptSyntaxError('Multiple statements cannot be placed on a single line.', s.token.loc);
		}
		while ((s.kind as TokenKind) === TokenKind.NewLine) {
			s.next();
		}
	}

	return nodes;
}

/**
 * ```abnf
 * Namespace = "::" IDENT "{" *(VarDef / FnDef / Namespace) "}"
 * ```
*/
export function parseNamespace(s: ITokenStream): Ast.Namespace {
	const loc = s.token.loc;

	s.nextWith(TokenKind.Colon2);

	s.expect(TokenKind.Identifier);
	const name = s.token.value!;
	s.next();

	const members: (Ast.Namespace | Ast.Definition)[] = [];
	s.nextWith(TokenKind.OpenBrace);

	while (s.kind === TokenKind.NewLine) {
		s.next();
	}

	while (s.kind !== TokenKind.CloseBrace) {
		switch (s.kind) {
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

		if ((s.kind as TokenKind) !== TokenKind.NewLine && (s.kind as TokenKind) !== TokenKind.CloseBrace) {
			throw new AiScriptSyntaxError('Multiple statements cannot be placed on a single line.', s.token.loc);
		}
		while ((s.kind as TokenKind) === TokenKind.NewLine) {
			s.next();
		}
	}
	s.nextWith(TokenKind.CloseBrace);

	return new Ast.Namespace(name, members, loc);
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
	if (s.kind === TokenKind.Identifier) {
		name = s.token.value!;
		s.next();
	}

	const value = parseExpr(s, true);

	return new Ast.Meta(name, value, loc);
}
