import * as aiscript from '..';
import { Node } from '../node';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const parseInternal = require('../../built/parser/parser.js').parse;

export type RawAST = {
	nodes: Node[];
};

export function parse(input: string): RawAST {
	let nodes: Node[];
	try {
		nodes = parseInternal(input);
	} catch (e) {
		if (e.location) {
			throw new aiscript.SyntaxError(`Line ${e.location.start.line}:${e.location.start.column}`);
		}
		throw e;
	}

	return {
		nodes
	};
}
