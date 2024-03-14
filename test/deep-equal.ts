import * as assert from 'assert';
import { deepEqual } from '../src/interpreter/deep-equal';

describe('compare', () => {
	test('object and object', () => {
		assert.strictEqual(deepEqual({ a: 1 }, { a: 1 }), true);
		assert.strictEqual(deepEqual({ a: 1 }, { a: 2 }), false);
		assert.strictEqual(deepEqual({ a: 1 }, { a: 1, b: 2 }), false);
	});

	test('number and number', () => {
		assert.strictEqual(deepEqual(1, 1), true);
		assert.strictEqual(deepEqual(1, 2), false);
	});

	test('number[] and number[]', () => {
		assert.strictEqual(deepEqual([1, 2, 3], [1, 2, 3]), true);
		assert.strictEqual(deepEqual([1, 2, 3], [4, 5, 6]), false);
		assert.strictEqual(deepEqual([1, 2], [1, 2, 3]), false);
		assert.strictEqual(deepEqual([1, 2, 3], [1, 2]), false);
	});

	test('string[] and string[]', () => {
		assert.strictEqual(deepEqual(['a', 'b', 'c'], ['a', 'b', 'c']), true);
		assert.strictEqual(deepEqual(['a', 'b', 'c'], ['x', 'y', 'z']), false);
		assert.strictEqual(deepEqual(['a', 'b'], ['a', 'b', 'c']), false);
		assert.strictEqual(deepEqual(['a', 'b', 'c'], ['a', 'b']), false);
	});

	test('object and null', () => {
		assert.strictEqual(deepEqual({ a: 1 }, null), false);
	});
});

test('null, undefined, NaN', () => {
	assert.strictEqual(deepEqual(null, null), true);
	assert.strictEqual(deepEqual(undefined, undefined), true);
	assert.strictEqual(deepEqual(NaN, NaN), true);
	assert.strictEqual(deepEqual(null, undefined), false);
	assert.strictEqual(deepEqual(null, NaN), false);
	assert.strictEqual(deepEqual(undefined, NaN), false);
});

describe('recursive', () => {
	test('simple', () => {
		let x: any = { n: null };
		x.n = x;
		let y: any = { n: null };
		y.n = y;
		assert.strictEqual(deepEqual(x, y), true);
	});

	test('complex', () => {
		let x: any = { a: { b: { a: null } } };
		x.a.b.a = x.a;
		let y: any = { a: { b: null } };
		y.a.b = y;
		assert.strictEqual(deepEqual(x, y), true);
	});

	test('complex 2', () => {
		let x: any = { a: { b: null } };
		x.a.b = x;
		let y: any = { a: { b: { a: { b: { a: null } } } } };
		y.a.b.a.b.a = y.a.b;
		assert.strictEqual(deepEqual(x, y), true);
	});

	test('complex 3', () => {
		let a: any = [{ a: [] }];
		let b: any = [{ a: [] }];
		a[0].a[0] = a;
		b[0].a[0] = b[0];
		assert.strictEqual(deepEqual(a, b), false);
	});
});
