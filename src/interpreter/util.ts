import { Value, Node } from '..';

export function valToString(val: Value) {
	const label =
		val.type === 'number' ? val.value :
		val.type === 'boolean' ? val.value :
		val.type === 'string' ? `"${val.value}"` :
		val.type === 'function' ? '...' :
		val.type === 'null' ? '' :
		null;
	return `${val.type}<${label}>`;
}

export function nodeToString(node: Node) {
	const label =
		node.type === 'number' ? node.value :
		node.type === 'boolean' ? node.value :
		node.type === 'string' ? node.value :
		node.type === 'func' ? null :
		node.type === 'null' ? null :
		node.type === 'def' ? node.name :
		node.type === 'var' ? node.name :
		node.type === 'call' ? node.name :
		null;
	return label ? `${node.type.toUpperCase()} (${label})` : node.type.toUpperCase();
}
