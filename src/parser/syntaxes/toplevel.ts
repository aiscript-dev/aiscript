import { NODE } from '../node.js';
import { TokenKind } from '../token.js';
import { parseDefStatement, parseStatement } from './statements.js';
import { parseStaticLiteral } from './common.js';

import type * as Cst from '../node.js';
import type { ITokenStream } from '../streams/token-stream.js';
import { AiScriptSyntaxError } from '../../error.js';

/**
 * ```abnf
 * TopLevel = *(Namespace / Meta / Statement)
 * ```
*/
export function parseTopLevel(s: ITokenStream): Cst.Node[] {
	const nodes: Cst.Node[] = [];

	while (s.kind !== TokenKind.EOF) {
		if (nodes.length > 0) {
			if (!s.token.lineBegin) {
				throw new AiScriptSyntaxError('Multiple statements cannot be placed on a single line.');
			}
		}
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
	}

	return nodes;
}

/**
 * ```abnf
 * Namespace = "::" IDENT "{" *(VarDef / FnDef / Namespace) "}"
 * ```
*/
export function parseNamespace(s: ITokenStream): Cst.Node {
	s.nextWith(TokenKind.Colon2);

	s.expect(TokenKind.Identifier);
	const name = s.token.value!;
	s.next();

	const members: Cst.Node[] = [];
	s.nextWith(TokenKind.OpenBrace);
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
	}
	s.nextWith(TokenKind.CloseBrace);

	return NODE('ns', { name, members });
}

/**
 * ```abnf
 * Meta = "###" [IDENT] StaticLiteral
 * ```
*/
export function parseMeta(s: ITokenStream): Cst.Node {
	s.nextWith(TokenKind.Sharp3);

	let name;
	if (s.kind === TokenKind.Identifier) {
		name = s.token.value;
		s.next();
	}

	const value = parseStaticLiteral(s);

	return NODE('meta', { name, value });
}
