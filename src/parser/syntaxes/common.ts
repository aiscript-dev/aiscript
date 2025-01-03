import { TokenKind } from '../token.js';
import { AiScriptSyntaxError, AiScriptUnexpectedEOFError } from '../../error.js';
import { NODE } from '../utils.js';
import { parseStatement } from './statements.js';
import { parseExpr } from './expressions.js';
import { parseType } from './types.js';

import type { ITokenStream } from '../streams/token-stream.js';
import type * as Ast from '../../node.js';

/**
 * ```abnf
 * Dest = IDENT / Expr
 * ```
*/
export function parseDest(s: ITokenStream): Ast.Expression {
	// 全部parseExprに任せるとparseReferenceが型注釈を巻き込んでパースしてしまうためIdentifierのみ個別に処理。
	if (s.is(TokenKind.Identifier)) {
		const nameStartPos = s.getPos();
		const name = s.getTokenValue();
		s.next();
		return NODE('identifier', { name }, nameStartPos, s.getPos());
	} else {
		return parseExpr(s, false);
	}
}

/**
 * ```abnf
 * Params = "(" [Dest [":" Type] *(SEP Dest [":" Type])] ")"
 * ```
*/
export function parseParams(s: ITokenStream): Ast.Fn['params'] {
	const items: Ast.Fn['params'] = [];

	s.expect(TokenKind.OpenParen);
	s.next();

	if (s.is(TokenKind.NewLine)) {
		s.next();
	}

	while (!s.is(TokenKind.CloseParen)) {
		const dest = parseDest(s);

		let optional = false;
		let defaultExpr: Ast.Expression | undefined;
		if (s.is(TokenKind.Question)) {
			s.next();
			optional = true;
		} else if (s.is(TokenKind.Eq)) {
			s.next();
			defaultExpr = parseExpr(s, false);
		}
		let type: Ast.TypeSource | undefined;
		if (s.is(TokenKind.Colon)) {
			s.next();
			type = parseType(s);
		}

		items.push({ dest, optional, default: defaultExpr, argType: type });

		// separator
		switch (s.getTokenKind()) {
			case TokenKind.NewLine: {
				s.next();
				break;
			}
			case TokenKind.Comma: {
				s.next();
				if (s.is(TokenKind.NewLine)) {
					s.next();
				}
				break;
			}
			case TokenKind.CloseParen: {
				break;
			}
			case TokenKind.EOF: {
				throw new AiScriptUnexpectedEOFError(s.getPos());
			}
			default: {
				throw new AiScriptSyntaxError('separator expected', s.getPos());
			}
		}
	}

	s.expect(TokenKind.CloseParen);
	s.next();

	return items;
}

/**
 * ```abnf
 * Block = "{" *Statement "}"
 * ```
*/
export function parseBlock(s: ITokenStream): (Ast.Statement | Ast.Expression)[] {
	s.expect(TokenKind.OpenBrace);
	s.next();

	while (s.is(TokenKind.NewLine)) {
		s.next();
	}

	const steps: (Ast.Statement | Ast.Expression)[] = [];
	while (!s.is(TokenKind.CloseBrace)) {
		steps.push(parseStatement(s));

		// terminator
		switch (s.getTokenKind()) {
			case TokenKind.NewLine:
			case TokenKind.SemiColon: {
				while (s.is(TokenKind.NewLine) || s.is(TokenKind.SemiColon)) {
					s.next();
				}
				break;
			}
			case TokenKind.CloseBrace: {
				break;
			}
			case TokenKind.EOF: {
				throw new AiScriptUnexpectedEOFError(s.getPos());
			}
			default: {
				throw new AiScriptSyntaxError('Multiple statements cannot be placed on a single line.', s.getPos());
			}
		}
	}

	s.expect(TokenKind.CloseBrace);
	s.next();

	return steps;
}

/**
 * ```abnf
 * Label = "#" IDENT
 * ```
*/
export function parseLabel(s: ITokenStream): string {
	s.expect(TokenKind.Sharp);
	s.next();

	if (s.getToken().hasLeftSpacing) {
		throw new AiScriptSyntaxError('cannot use spaces in a label', s.getPos());
	}
	s.expect(TokenKind.Identifier);
	const label = s.getTokenValue();
	s.next();

	return label;
}

/**
 * ```abnf
 * OptionalSeparator = [SEP]
 * ```
*/
export function parseOptionalSeparator(s: ITokenStream): boolean {
	switch (s.getTokenKind()) {
		case TokenKind.NewLine: {
			s.next();
			return true;
		}
		case TokenKind.Comma: {
			s.next();
			if (s.is(TokenKind.NewLine)) {
				s.next();
			}
			return true;
		}
		default: {
			return false;
		}
	}
}
