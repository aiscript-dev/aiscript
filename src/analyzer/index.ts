import { Node } from '../node';
import { setAttribute } from './set-attribute';

export function analyze(nodes: Node[]): Node[] {
	nodes = setAttribute(nodes);

	return nodes;
}
