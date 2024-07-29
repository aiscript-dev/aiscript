import { TokenKind } from '../token.js';
import { AiScriptSyntaxError } from '../../error.js';
import { NODE } from '../utils.js';
import { parseStatement } from './statements.js';
import { parseExpr } from './expressions.js';

import type { ITokenStream } from '../streams/token-stream.js';
import type * as Ast from '../../node.js';

/**
 * ```abnf
 * Params = "(" [IDENT [":" Type] *(SEP IDENT [":" Type])] ")"
 * ```
*/
export function parseParams(s: ITokenStream): { name: string, argType?: Ast.Node }[] {
	const items: { name: string, optional?: boolean, default?: Ast.Node, argType?: Ast.Node }[] = [];

	s.nextWith(TokenKind.OpenParen);

	if (s.getKind() === TokenKind.NewLine) {
		s.next();
	}

	while (s.getKind() !== TokenKind.CloseParen) {
		s.expect(TokenKind.Identifier);
		const name = s.token.value!;
		s.next();

		let optional = false;
		let defaultExpr;
		if ((s.getKind() as TokenKind) === TokenKind.Question) {
			s.next();
			optional = true;
		} else if ((s.getKind() as TokenKind) === TokenKind.Eq) {
			s.next();
			defaultExpr = parseExpr(s, false);
		}
		let type;
		if (s.getKind() === TokenKind.Colon) {
			s.next();
			type = parseType(s);
		}

		items.push({ name, optional, default: defaultExpr, argType: type });

		// separator
		switch (s.getKind()) {
			case TokenKind.NewLine: {
				s.next();
				break;
			}
			case TokenKind.Comma: {
				s.next();
				if (s.getKind() === TokenKind.NewLine) {
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

	s.nextWith(TokenKind.CloseParen);

	return items;
}

/**
 * ```abnf
 * Block = "{" *Statement "}"
 * ```
*/
export function parseBlock(s: ITokenStream): Ast.Node[] {
	s.nextWith(TokenKind.OpenBrace);

	while (s.getKind() === TokenKind.NewLine) {
		s.next();
	}

	const steps: Ast.Node[] = [];
	while (s.getKind() !== TokenKind.CloseBrace) {
		steps.push(parseStatement(s));

		// terminator
		switch (s.getKind()) {
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
				throw new AiScriptSyntaxError('Multiple statements cannot be placed on a single line.', s.getPos());
			}
		}
	}

	s.nextWith(TokenKind.CloseBrace);

	return steps;
}

//#region Type

export function parseType(s: ITokenStream): Ast.Node {
	if (s.getKind() === TokenKind.At) {
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
function parseFnType(s: ITokenStream): Ast.Node {
	const startPos = s.getPos();

	s.nextWith(TokenKind.At);
	s.nextWith(TokenKind.OpenParen);

	const params: Ast.Node[] = [];
	while (s.getKind() !== TokenKind.CloseParen) {
		if (params.length > 0) {
			switch (s.getKind()) {
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

	s.nextWith(TokenKind.CloseParen);
	s.nextWith(TokenKind.Arrow);

	const resultType = parseType(s);

	return NODE('fnTypeSource', { args: params, result: resultType }, startPos, s.getPos());
}

/**
 * ```abnf
 * NamedType = IDENT ["<" Type ">"]
 * ```
*/
function parseNamedType(s: ITokenStream): Ast.Node {
	const startPos = s.getPos();

	s.expect(TokenKind.Identifier);
	const name = s.token.value!;
	s.next();

	// inner type
	let inner = null;
	if (s.getKind() === TokenKind.Lt) {
		s.next();
		inner = parseType(s);
		s.nextWith(TokenKind.Gt);
	}

	return NODE('namedTypeSource', { name, inner }, startPos, s.getPos());
}

//#endregion Type
