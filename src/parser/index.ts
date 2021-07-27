import * as aiscript from '..';
import { Node } from '../node';

const parseInternal = require('../../built/parser/parser.js').parse;

export function parse(input: string): Node[] {
	let nodes: Node[];
	try {
		nodes = parseInternal(input);
	} catch (e) {
		if (e.location) {
			throw new aiscript.SyntaxError(`Line ${e.location.start.line}:${e.location.start.column}`);
		}
		throw e;
	}

	return nodes;
}
