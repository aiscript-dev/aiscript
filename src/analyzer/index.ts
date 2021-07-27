import { Node } from '../node';
import { RawAST } from '../parser';
import { setAttribute } from './set-attribute';

export function analyze(ast: RawAST): Node[] {
	const nodes = setAttribute(ast.nodes);

	return nodes;
}
