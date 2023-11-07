import * as assert from 'assert';
import { equal } from '../src/equal';

test('null, undefined, NaN', () => {
	assert.strictEqual(equal(null, null), true);
	assert.strictEqual(equal(undefined, undefined), true);
	assert.strictEqual(equal(NaN, NaN), true);

	assert.strictEqual(equal(null, undefined), false);
	assert.strictEqual(equal(null, NaN), false);
	assert.strictEqual(equal(undefined, NaN), false);
});

test('object', () => {
	assert.strictEqual(equal({ a: 1 }, { a: 1 }), true);
	assert.strictEqual(equal({ a: 1 }, null), false);
});

test('number', () => {
	assert.strictEqual(equal(1, 1), true);
	assert.strictEqual(equal(1, 2), false);
});

test('array', () => {
	assert.strictEqual(equal([1], [1]), true);
	assert.strictEqual(equal([1], [2]), false);
});

test('recursive', () => {
	let x: any = { n: null };
	x.n = x;
	let y: any = { n: null };
	y.n = y;
	assert.strictEqual(equal(x, y), true);
});

test('recursive 2', () => {
	let x: any = { a: { b: { a: null } } };
	x.a.b.a = x.a;
	let y: any = { a: { b: null } };
	y.a.b = y;
	assert.strictEqual(equal(x, y), true);
});
