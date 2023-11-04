import { TokenKind } from '../token.js';
import { AiScriptSyntaxError } from '../../error.js';
import { parseStatement } from './statements.js';
import * as Ast from '../../node.js';

import type { ITokenStream } from '../streams/token-stream.js';

/**
 * ```abnf
 * Params = "(" [IDENT [":" Type] *(SEP IDENT [":" Type])] ")"
 * ```
*/
export function parseParams(s: ITokenStream): { name: string, argType: Ast.TypeSource | null }[] {
	const items: { name: string, argType: Ast.TypeSource | null }[] = [];

	s.nextWith(TokenKind.OpenParen);

	if (s.kind === TokenKind.NewLine) {
		s.next();
	}

	while (s.kind !== TokenKind.CloseParen) {
		s.expect(TokenKind.Identifier);
		const name = s.token.value!;
		s.next();

		let type = null;
		if ((s.kind as TokenKind) === TokenKind.Colon) {
			s.next();
			type = parseType(s);
		}

		items.push({ name, argType: type });

		// separator
		switch (s.kind as TokenKind) {
			case TokenKind.NewLine: {
				s.next();
				break;
			}
			case TokenKind.Comma: {
				s.next();
				if (s.kind === TokenKind.NewLine) {
					s.next();
				}
				break;
			}
			case TokenKind.CloseParen: {
				break;
			}
			default: {
				throw new AiScriptSyntaxError('separator expected', s.token.loc);
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
export function parseBlock(s: ITokenStream): Ast.Statement[] {
	s.nextWith(TokenKind.OpenBrace);

	while (s.kind === TokenKind.NewLine) {
		s.next();
	}

	const steps: Ast.Statement[] = [];
	while (s.kind !== TokenKind.CloseBrace) {
		steps.push(parseStatement(s));

		// terminator
		switch (s.kind as TokenKind) {
			case TokenKind.NewLine:
			case TokenKind.SemiColon: {
				while ([TokenKind.NewLine, TokenKind.SemiColon].includes(s.kind)) {
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

	return steps;
}

//#region Type

export function parseType(s: ITokenStream): Ast.TypeSource {
	if (s.kind === TokenKind.At) {
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
	const loc = s.token.loc;

	s.nextWith(TokenKind.At);
	s.nextWith(TokenKind.OpenParen);

	const params: Ast.TypeSource[] = [];
	while (s.kind !== TokenKind.CloseParen) {
		if (params.length > 0) {
			switch (s.kind as TokenKind) {
				case TokenKind.Comma: {
					s.next();
					break;
				}
				default: {
					throw new AiScriptSyntaxError('separator expected', s.token.loc);
				}
			}
		}
		const type = parseType(s);
		params.push(type);
	}

	s.nextWith(TokenKind.CloseParen);
	s.nextWith(TokenKind.Arrow);

	const resultType = parseType(s);

	return new Ast.FnTypeSource(params, resultType, loc);
}

/**
 * ```abnf
 * NamedType = IDENT ["<" Type ">"]
 * ```
*/
function parseNamedType(s: ITokenStream): Ast.TypeSource {
	const loc = s.token.loc;

	s.expect(TokenKind.Identifier);
	const name = s.token.value!;
	s.next();

	// inner type
	let inner = null;
	if (s.kind === TokenKind.Lt) {
		s.next();
		inner = parseType(s);
		s.nextWith(TokenKind.Gt);
	}

	return new Ast.NamedTypeSource(name, inner, loc);
}

//#endregion Type
