import * as N from '../node';
import * as Ast from './node';
import { AiScriptError } from '../error';
import * as parser from './parser.js';

import { validateKeyword } from './plugins/validate-keyword';
import { validateType } from './plugins/validate-type';
import { setAttribute } from './plugins/set-attribute';
import { transformChain } from './plugins/transform-chain';
import { infixToFnCall } from './plugins/infix-to-fncall';

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
				setAttribute,
				transformChain,
				infixToFnCall,
			],
		};
	}

	public static parse(input: string): N.Node[] {
		if (Parser.instance == null) {
			Parser.instance = new Parser();
		}
		return Parser.instance.parse(input);
	}

	public addPlugin(type: PluginType, plugin: ParserPlugin) {
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
					throw new AiScriptError(`Line ${e.location.start.line}:${e.location.start.column}`);
				} else {
					throw new AiScriptError(`${e.message} Line ${e.location.start.line}:${e.location.start.column}`);
				}
			}
			throw e;
		}

		// validate the node tree
		for (const plugin of this.plugins.validate) {
			nodes = plugin(nodes);
		}

		// transform the node tree
		for (const plugin of this.plugins.transform) {
			nodes = plugin(nodes);
		}

		return nodes as N.Node[];
	}
}
