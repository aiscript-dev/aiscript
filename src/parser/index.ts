import { AiScriptSyntaxError } from '../error.js';
import { TokenStream } from './token-stream.js';
import type { Token } from './token.js';
import { TokenKind } from './token.js';

import { validateKeyword } from './plugins/validate-keyword.js';
import { validateType } from './plugins/validate-type.js';
import { setAttribute } from './plugins/set-attribute.js';
import { transformChain } from './plugins/transform-chain.js';
import { infixToFnCall } from './plugins/infix-to-fncall.js';
import type * as Cst from './node.js';
import type * as Ast from '../node.js';

export type ParserPlugin = (nodes: Cst.Node[]) => Cst.Node[];
export type PluginType = 'validate' | 'transform';

export class Parser {
	private static instance?: Parser;
	private plugins: {
		validate: ParserPlugin[];
		transform: ParserPlugin[];
	};

	constructor() {
		this.plugins = {
			validate: [
				validateKeyword,
				validateType,
			],
			transform: [
				setAttribute,
				transformChain,
				infixToFnCall,
			],
		};
	}

	public static parse(input: string): Ast.Node[] {
		if (Parser.instance == null) {
			Parser.instance = new Parser();
		}
		return Parser.instance.parse(input);
	}

	public addPlugin(type: PluginType, plugin: ParserPlugin): void {
		switch (type) {
			case 'validate':
				this.plugins.validate.push(plugin);
				break;
			case 'transform':
				this.plugins.transform.push(plugin);
				break;
			default:
				throw new Error('unknown plugin type');
		}
	}

	public parse(input: string): Ast.Node[] {
		let nodes: Cst.Node[];

		nodes = parse(input);

		// validate the node tree
		for (const plugin of this.plugins.validate) {
			nodes = plugin(nodes);
		}

		// transform the node tree
		for (const plugin of this.plugins.transform) {
			nodes = plugin(nodes);
		}

		return nodes as Ast.Node[];
	}
}

class ParseContext {
	private stream: TokenStream;

	public constructor(stream: TokenStream) {
		this.stream = stream;
	}

	public init(): void {
		this.stream.read();
	}

	public get token(): Token {
		return this.stream.current;
	}

	public kindOf(kind: TokenKind): boolean {
		return (this.token.kind === kind);
	}

	public expect(kind: TokenKind): void {
		if (!this.kindOf(kind)) {
			throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[this.token.kind]}`);
		}
	}

	public next(): void {
		this.stream.read();
	}

	public consumeAs(kind: TokenKind): void {
		this.expect(kind);
		this.next();
	}
}

function parse(source: string): Cst.Node[] {
	const stream = new TokenStream(source);
	const ctx = new ParseContext(stream);
	stream.init();
	ctx.init();

	const nodes: Cst.Node[] = [];
	while (!ctx.kindOf(TokenKind.EOF)) {
		switch (ctx.token.kind) {
			case TokenKind.Colon2: {
				nodes.push(parseNamespace(ctx));
				break;
			}
			case TokenKind.Sharp3: {
				nodes.push(parseMeta(ctx));
				break;
			}
			default: {
				nodes.push(parseStatement(ctx));
				break;
			}
		}
	}

	return nodes;
}

function parseNamespace(ctx: ParseContext): Cst.Node {
	throw new Error('todo');
}

function parseMeta(ctx: ParseContext): Cst.Node {
	throw new Error('todo');
}

function parseStatement(ctx: ParseContext): Cst.Node {
	throw new Error('todo');
}
