import * as aiscript from '..';
import { Node } from '../node';
import * as parser from './parser.js';

import { validateKeyword } from './plugins/validate-keyword';
import { setAttribute } from './plugins/set-attribute';

export type ParserPlugin = (nodes: Node[]) => Node[];

export class Parser {
	private static instance?: Parser;
	private plugins: ParserPlugin[];

	constructor() {
		this.plugins = [
			validateKeyword,
			setAttribute,
		];
	}

	public static parse(input: string): Node[] {
		if (Parser.instance == null) {
			Parser.instance = new Parser();
		}
		return Parser.instance.parse(input);
	}

	public addPlugin(plugin: ParserPlugin) {
		this.plugins.push(plugin);
	}

	public parse(input: string): Node[] {
		let nodes: Node[];

		// generate a node tree
		try {
			nodes = parser.parse(input);
		} catch (e) {
			if (e.location) {
				throw new aiscript.SyntaxError(`Line ${e.location.start.line}:${e.location.start.column}`);
			}
			throw e;
		}

		// validate and transform the node tree
		for (const plugin of this.plugins) {
			nodes = plugin(nodes);
		}

		return nodes;
	}
}

// alias of legacy api

export function parse(input: string): Node[] {
	return Parser.parse(input);
}
