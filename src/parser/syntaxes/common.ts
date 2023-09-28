import { TokenKind } from '../token.js';
import { parseStatement } from './statements.js';

import type { ITokenStream } from '../streams/token-stream.js';
import type * as Cst from '../node.js';

export function parseParams(s: ITokenStream): Cst.Node[] {
	throw new Error('todo');
}

/**
 * ```abnf
 * Block = "{" *Statement "}"
 * ```
*/
export function parseBlock(s: ITokenStream): Cst.Node[] {
	s.nextWith(TokenKind.OpenBrace);

	const steps: Cst.Node[] = [];
	while (s.kind !== TokenKind.CloseBrace) {
		steps.push(parseStatement(s));
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
