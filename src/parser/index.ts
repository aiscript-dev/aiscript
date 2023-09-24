import { Scanner } from './token-stream.js';
import { parseTopLevel } from './syntaxes.js';

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

		const scanner = new Scanner(input);
		scanner.init();
		nodes = parseTopLevel(scanner);

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
