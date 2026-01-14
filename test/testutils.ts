import { expect as globalExpect } from 'vitest';
import { Parser, Interpreter } from '../src';
import { Value } from '../src/interpreter/value';
import { std } from '../src/interpreter/lib/std';

export async function exe(script: string): Promise<Value | undefined> {
	const parser = new Parser();
	let result = undefined;
	const interpreter = new Interpreter(std, {
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
	const interpreter = new Interpreter(std, {
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

export const eq = (a: Value | undefined, b: Value | undefined, expect = globalExpect) => {
	expect(a).not.toBeUndefined();
	expect(b).not.toBeUndefined();
	expect(a!.type).toEqual(b!.type);
	if ('value' in a!) {
		expect('value' in b!).toBe(true);
		expect(a.value).toEqual((b as { value: unknown }).value);
	} else {
		expect('value' in b!).toBe(false);
	}
};

