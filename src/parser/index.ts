import * as aiscript from '..';
import * as N from '../node';
import * as Ast from './node';
import * as parser from './parser.js';

import { validateKeyword } from './plugins/validate-keyword';
import { validateType } from './plugins/validate-type';
import { setAttribute } from './plugins/set-attribute';

export type ParserPlugin = (nodes: Ast.Node[]) => Ast.Node[];

export class Parser {
	private static instance?: Parser;
	private plugins: ParserPlugin[];

	constructor() {
		this.plugins = [
			validateKeyword,
			validateType,
			setAttribute,
		];
	}

	public static parse(input: string): N.Node[] {
		if (Parser.instance == null) {
			Parser.instance = new Parser();
		}
		return Parser.instance.parse(input);
	}

	public addPlugin(plugin: ParserPlugin) {
		this.plugins.push(plugin);
	}

	public parse(input: string): N.Node[] {
		let nodes: Ast.Node[];

		// generate a node tree
		try {
			// apply preprocessor
			const code = parser.parse(input, { startRule: 'Preprocess' });
			// apply main parser
			nodes = parser.parse(code, { startRule: 'Main' });
		} catch (e) {
			if (e.location) {
				if (e.expected) {
					throw new aiscript.SyntaxError(`Line ${e.location.start.line}:${e.location.start.column}`);
				} else {
					throw new aiscript.SyntaxError(`${e.message} Line ${e.location.start.line}:${e.location.start.column}`);
				}
			}
			throw e;
		}

		// validate and transform the node tree
		for (const plugin of this.plugins) {
			nodes = plugin(nodes);
		}

		return nodes as N.Node[];
	}
}

// alias of legacy api

export function parse(input: string): N.Node[] {
	return Parser.parse(input);
}
