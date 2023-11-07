import * as assert from 'assert';
import { equal } from '../src/equal';

test('all', () => {
	assert.strictEqual(equal(null, null), true);
	assert.strictEqual(equal(undefined, undefined), true);
	assert.strictEqual(equal(NaN, NaN), true);

	assert.strictEqual(equal(null, undefined), false);
	assert.strictEqual(equal(null, NaN), false);
	assert.strictEqual(equal(undefined, NaN), false);

	assert.strictEqual(equal({ a: 1 }, { a: 1 }), true);
	assert.strictEqual(equal({ a: 1 }, null), false);

	let x: any = { n: null };
	x.n = x;
	let y: any = { n: null };
	y.n = y;
	assert.strictEqual(equal(x, y), true);
});
