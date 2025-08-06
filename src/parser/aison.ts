/**
 * AiSON: AiScript Object Notation
 */
import { nodeToJs } from '../utils/node-to-js.js';
import { Scanner } from './scanner.js';
import { parseAiSonTopLevel } from './syntaxes/aison.js';
import type { JsValue } from '../interpreter/util.js';

export class AiSON {
	public static parse(input: string): JsValue {
		const scanner = new Scanner(input);
		const ast = parseAiSonTopLevel(scanner);

		return nodeToJs(ast);
	}
}
