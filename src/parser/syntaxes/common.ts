import { TokenKind } from '../token.js';
import { AiScriptSyntaxError } from '../../error.js';
import { parseStatement } from './statements.js';

import type { ITokenStream } from '../streams/token-stream.js';
import type * as Cst from '../node.js';

/**
 * ```abnf
 * Params = "(" [IDENT *(("," / SPACE) IDENT)] ")"
 * ```
*/
export function parseParams(s: ITokenStream): { name: string }[] {
	const items: { name: string }[] = [];

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
		items.push({ name: s.token.value! });
		s.next();
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
	throw new Error('todo');
}

export function parseFnType(s: ITokenStream): Cst.Node {
	throw new Error('todo');
}

export function parseNamedType(s: ITokenStream): Cst.Node {
	throw new Error('todo');
}

//#endregion Type
