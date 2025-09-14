import * as assert from 'assert';
import { Parser, Interpreter } from '../src';

export async function exe(script: string): Promise<Value | undefined> {
	const parser = new Parser();
	let result = undefined;
	const interpreter = new Interpreter({}, {
		out(value) {
			if (!result) result = value;
			else if (!Array.isArray(result)) result = [result, value];
			else result.push(value);
		},
		log(type, {val}) {
			if (type === 'end') result ??= val;
		},
		maxStep: 9999,
	});
	const ast = parser.parse(script);
	await interpreter.exec(ast);
	return result;
};

export function exeSync(script: string): Value | undefined {
	const parser = new Parser();
	const interpreter = new Interpreter({}, {
		out(value) {
		},
		log(type, {val}) {
		},
		maxStep: 9999,
	});
	const ast = parser.parse(script);
	return interpreter.execSync(ast);
};

export const getMeta = (script: string) => {
	const parser = new Parser();
	const ast = parser.parse(script);

	const metadata = Interpreter.collectMetadata(ast);

	return metadata;
};

export const eq = (a, b) => {
	assert.deepEqual(a.type, b.type);
	assert.deepEqual(a.value, b.value);
};

