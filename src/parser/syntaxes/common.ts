import { TokenKind } from '../token.js';
import { AiScriptSyntaxError } from '../../error.js';
import { parseStatement } from './statements.js';
import { NODE } from '../node.js';

import type { ITokenStream } from '../streams/token-stream.js';
import type * as Cst from '../node.js';

/**
 * ```abnf
 * Params = "(" [IDENT *(("," / SPACE) IDENT)] ")"
 * ```
*/
export function parseParams(s: ITokenStream): { name: string, argType?: Cst.Node }[] {
	const items: { name: string, argType?: Cst.Node }[] = [];

	s.nextWith(TokenKind.OpenParen);

	while (s.kind !== TokenKind.CloseParen) {
		// separator
		if (items.length > 0) {
			if (s.kind === TokenKind.Comma) {
				s.next();
			} else if (!s.token.hasLeftSpacing) {
				throw new AiScriptSyntaxError('separator expected');
			}
		}

		s.expect(TokenKind.Identifier);
		const name = s.token.value!;
		s.next();

		let type;
		if ((s.kind as TokenKind) === TokenKind.Colon) {
			s.next();
			type = parseType(s);
		}

		items.push({ name, argType: type });
	}

	s.nextWith(TokenKind.CloseParen);

	return items;
}

/**
 * ```abnf
 * Block = "{" *Statement "}"
 * ```
*/
export function parseBlock(s: ITokenStream): Cst.Node[] {
	s.nextWith(TokenKind.OpenBrace);

	while (s.kind === TokenKind.NewLine) {
		s.next();
	}

	const steps: Cst.Node[] = [];
	while (s.kind !== TokenKind.CloseBrace) {
		steps.push(parseStatement(s));

		if ((s.kind as TokenKind) !== TokenKind.NewLine && (s.kind as TokenKind) !== TokenKind.CloseBrace) {
			throw new AiScriptSyntaxError('Multiple statements cannot be placed on a single line.');
		}
		while ((s.kind as TokenKind) === TokenKind.NewLine) {
			s.next();
		}
	}

	s.nextWith(TokenKind.CloseBrace);

	return steps;
}

//#region Type

export function parseType(s: ITokenStream): Cst.Node {
	if (s.kind === TokenKind.At) {
		return parseFnType(s);
	} else {
		return parseNamedType(s);
	}
}

/**
 * ```abnf
 * FnType = "@" "(" ParamTypes ")" "=>" Type
 * ParamTypes = [Type *(("," / SPACE) Type)]
 * ```
*/
function parseFnType(s: ITokenStream): Cst.Node {
	const loc = s.token.loc;

	s.nextWith(TokenKind.At);
	s.nextWith(TokenKind.OpenParen);

	const params: Cst.Node[] = [];
	while (s.kind !== TokenKind.CloseParen) {
		if (params.length > 0) {
			if (s.kind === TokenKind.Comma) {
				s.next();
			} else if (!s.token.hasLeftSpacing) {
				throw new AiScriptSyntaxError('separator expected');
			}
		}
		const type = parseType(s);
		params.push(type);
	}

	s.nextWith(TokenKind.CloseParen);
	s.nextWith(TokenKind.Arrow);

	const resultType = parseType(s);

	return NODE('fnTypeSource', { args: params, result: resultType }, loc);
}

/**
 * ```abnf
 * NamedType = IDENT ["<" Type ">"]
 * ```
*/
function parseNamedType(s: ITokenStream): Cst.Node {
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

	return NODE('namedTypeSource', { name, inner }, loc);
}

//#endregion Type
