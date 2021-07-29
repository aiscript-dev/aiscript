import { Node } from '../node';
import { RawAST } from '../parser';
import { setAttribute } from './set-attribute';
import { validateKeyword } from './validate-keyword';

export function analyze(ast: RawAST): Node[] {

	// validation
	validateKeyword(ast.nodes);

	// transform
	let nodes = setAttribute(ast.nodes);

	return nodes;
}
