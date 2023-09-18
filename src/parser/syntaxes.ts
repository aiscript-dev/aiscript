import { AiScriptSyntaxError } from '../error.js';
import { Cst } from '../index.js';
import { TokenStream } from './token-stream.js';
import { TokenKind } from './token.js';

export function parseTopLevel(stream: TokenStream): Cst.Node[] {
	const nodes: Cst.Node[] = [];
	while (!stream.kindOf(TokenKind.EOF)) {
		switch (stream.token.kind) {
			case TokenKind.Colon2: {
				nodes.push(parseNamespace(stream));
				break;
			}
			case TokenKind.Sharp3: {
				nodes.push(parseMeta(stream));
				break;
			}
			default: {
				nodes.push(parseStatement(stream));
				break;
			}
		}
	}

	return nodes;
}

export function parseNamespace(stream: TokenStream): Cst.Node {
	throw new Error('todo');
}

export function parseMeta(stream: TokenStream): Cst.Node {
	throw new Error('todo');
}

export function parseStatement(stream: TokenStream): Cst.Node {
	throw new Error('todo');
}
