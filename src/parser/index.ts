import { Scanner } from './scanner.js';
import { parseTopLevel } from './syntaxes/toplevel.js';

import { validateKeyword } from './plugins/validate-keyword.js';
import { validateType } from './plugins/validate-type.js';

import type * as Ast from '../node.js';

export type ParserPlugin = (nodes: Ast.Node[]) => Ast.Node[];
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
		let nodes: Ast.Node[];

		const scanner = new Scanner(input);
		nodes = parseTopLevel(scanner);

		// validate the node tree
		for (const plugin of this.plugins.validate) {
			nodes = plugin(nodes);
		}

		// transform the node tree
		for (const plugin of this.plugins.transform) {
			nodes = plugin(nodes);
		}

		return nodes;
	}
}
