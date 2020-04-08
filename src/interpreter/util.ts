import { Value, Node, VString, VNumber, VBoolean, VFunction } from '.';
import { AiScriptError } from './error';

export function assertBoolean(val: Value): asserts val is VBoolean {
	if (val.type !== 'boolean') {
		throw new AiScriptError(`Expect boolean, but got ${val.type}.`);
	}
}

export function assertFunction(val: Value): asserts val is VFunction {
	if (val.type !== 'function') {
		throw new AiScriptError(`Expect function, but got ${val.type}.`);
	}
}

export function assertString(val: Value): asserts val is VString {
	if (val.type !== 'string') {
		throw new AiScriptError(`Expect string, but got ${val.type}.`);
	}
}

export function assertNumber(val: Value): asserts val is VNumber {
	if (val.type !== 'number') {
		throw new AiScriptError(`Expect number, but got ${val.type}.`);
	}
}

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
