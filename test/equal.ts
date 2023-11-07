import * as assert from 'assert';
import { equal } from '../src/equal';

describe('compare', () => {
	test('object and object', () => {
		assert.strictEqual(equal({ a: 1 }, { a: 1 }), true);
		assert.strictEqual(equal({ a: 1 }, { a: 2 }), false);
	});

	test('number and number', () => {
		assert.strictEqual(equal(1, 1), true);
		assert.strictEqual(equal(1, 2), false);
	});

	test('number[] and number[]', () => {
		assert.strictEqual(equal([1, 2, 3], [1, 2, 3]), true);
		assert.strictEqual(equal([1, 2, 3], [4, 5, 6]), false);
		assert.strictEqual(equal([1, 2], [1, 2, 3]), false);
		assert.strictEqual(equal([1, 2, 3], [1, 2]), false);
	});

	test('string[] and string[]', () => {
		assert.strictEqual(equal(['a', 'b', 'c'], ['a', 'b', 'c']), true);
		assert.strictEqual(equal(['a', 'b', 'c'], ['x', 'y', 'z']), false);
		assert.strictEqual(equal(['a', 'b'], ['a', 'b', 'c']), false);
		assert.strictEqual(equal(['a', 'b', 'c'], ['a', 'b']), false);
	});

	test('object and null', () => {
		assert.strictEqual(equal({ a: 1 }, null), false);
	});
});

test('null, undefined, NaN', () => {
	assert.strictEqual(equal(null, null), true);
	assert.strictEqual(equal(undefined, undefined), true);
	assert.strictEqual(equal(NaN, NaN), true);
	assert.strictEqual(equal(null, undefined), false);
	assert.strictEqual(equal(null, NaN), false);
	assert.strictEqual(equal(undefined, NaN), false);
});

describe('recursive', () => {
	test('simple', () => {
		let x: any = { n: null };
		x.n = x;
		let y: any = { n: null };
		y.n = y;
		assert.strictEqual(equal(x, y), true);
	});

	test('complex', () => {
		let x: any = { a: { b: { a: null } } };
		x.a.b.a = x.a;
		let y: any = { a: { b: null } };
		y.a.b = y;
		assert.strictEqual(equal(x, y), true);
	});
});
