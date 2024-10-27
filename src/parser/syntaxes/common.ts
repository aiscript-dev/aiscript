import { TokenKind } from '../token.js';
import { AiScriptSyntaxError } from '../../error.js';
import { NODE } from '../utils.js';
import { parseStatement } from './statements.js';
import { parseExpr } from './expressions.js';

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
			default: {
				throw new AiScriptSyntaxError('Multiple statements cannot be placed on a single line.', s.getPos());
			}
		}
	}

	s.expect(TokenKind.CloseBrace);
	s.next();

	return steps;
}

//#region Type

export function parseType(s: ITokenStream): Ast.TypeSource {
	if (s.is(TokenKind.At)) {
		return parseFnType(s);
	} else {
		return parseNamedType(s);
	}
}

/**
 * ```abnf
 * FnType = "@" "(" ParamTypes ")" "=>" Type
 * ParamTypes = [Type *(SEP Type)]
 * ```
*/
function parseFnType(s: ITokenStream): Ast.TypeSource {
	const startPos = s.getPos();

	s.expect(TokenKind.At);
	s.next();
	s.expect(TokenKind.OpenParen);
	s.next();

	const params: Ast.TypeSource[] = [];
	while (!s.is(TokenKind.CloseParen)) {
		if (params.length > 0) {
			switch (s.getTokenKind()) {
				case TokenKind.Comma: {
					s.next();
					break;
				}
				default: {
					throw new AiScriptSyntaxError('separator expected', s.getPos());
				}
			}
		}
		const type = parseType(s);
		params.push(type);
	}

	s.expect(TokenKind.CloseParen);
	s.next();
	s.expect(TokenKind.Arrow);
	s.next();

	const resultType = parseType(s);

	return NODE('fnTypeSource', { params, result: resultType }, startPos, s.getPos());
}

/**
 * ```abnf
 * NamedType = IDENT ["<" Type ">"]
 * ```
*/
function parseNamedType(s: ITokenStream): Ast.TypeSource {
	const startPos = s.getPos();

	s.expect(TokenKind.Identifier);
	const name = s.getTokenValue();
	s.next();

	// inner type
	let inner: Ast.TypeSource | undefined;
	if (s.is(TokenKind.Lt)) {
		s.next();
		inner = parseType(s);
		s.expect(TokenKind.Gt);
		s.next();
	}

	return NODE('namedTypeSource', { name, inner }, startPos, s.getPos());
}

//#endregion Type
