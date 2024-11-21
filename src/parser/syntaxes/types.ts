import { AiScriptSyntaxError, AiScriptUnexpectedEOFError } from '../../error.js';
import { TokenKind } from '../token.js';
import { NODE } from '../utils.js';

import type { Ast } from '../../index.js';
import type { ITokenStream } from '../streams/token-stream.js';

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
				case TokenKind.EOF: {
					throw new AiScriptUnexpectedEOFError(s.getPos());
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

	let name: string;
	if (s.is(TokenKind.Identifier)) {
		name = s.getTokenValue();
		s.next();
	} else {
		s.expect(TokenKind.NullKeyword);
		s.next();
		name = 'null';
	}

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
