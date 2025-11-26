/**
 * AiSON: AiScript Object Notation
 */
import { nodeToJs } from '../utils/node-to-js.js';
import { Scanner } from './scanner.js';
import { parseAiSonTopLevel } from './syntaxes/aison.js';
import { jsToVal } from '../interpreter/util.js';
import type { JsValue } from '../interpreter/util.js';
import type { Value } from '../interpreter/value.js';

export class AiSON {
	public static parse(input: string): JsValue {
		const scanner = new Scanner(input);
		const ast = parseAiSonTopLevel(scanner);

		return nodeToJs(ast);
	}

	private static stringifyWalk(value: Value, indent: string | null, currentIndent = ''): string {
		switch (value.type) {
			case 'bool': return value.value ? 'true' : 'false';
			case 'null': return 'null';
			case 'num': return value.value.toString();
			case 'str': return JSON.stringify(value.value);
			case 'arr': {
				if (value.value.length === 0) return '[]';
				const items = value.value.map(item => this.stringifyWalk(item, indent, currentIndent + (indent ?? '')));
				if (indent != null && indent !== '') {
					return `[\n${currentIndent + indent}${items.join(`,\n${currentIndent + indent}`)}\n${currentIndent}]`;
				} else {
					return `[${items.join(', ')}]`;
				}
			}
			case 'obj': {
				const keys = [...value.value.keys()];
				if (keys.length === 0) return '{}';
				const items = keys.map(key => {
					const val = value.value.get(key)!;
					return `${key}: ${this.stringifyWalk(val, indent, currentIndent + (indent ?? ''))}`;
				});
				if (indent != null && indent !== '') {
					return `{\n${currentIndent + indent}${items.join(`,\n${currentIndent + indent}`)}\n${currentIndent}}`;
				} else {
					return `{${items.join(', ')}}`;
				}
			}
			default:
				throw new Error(`Cannot stringify value of type: ${value.type}`);
		}
	}

	public static stringify(value: JsValue, _unused = null, indent: number | string = 0): string {
		let _indent: string | null = null;
		if (typeof indent === 'number') {
			if (indent > 0) {
				_indent = ' '.repeat(indent);
			}
		} else if (indent.length > 0) {
			_indent = indent;
		}

		const aisValue = jsToVal(value);

		return this.stringifyWalk(aisValue, _indent);
	}
}
