/**
 * AiSON: AiScript Object Notation
 */
import { nodeToJs } from '../utils/node-to-js.js';
import { Scanner } from './scanner.js';
import { parseAiSonTopLevel } from './syntaxes/aison.js';

export class AiSON {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static parse(input: string): any {
		const scanner = new Scanner(input);
		const ast = parseAiSonTopLevel(scanner);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return nodeToJs(ast) as any;
	}
}
