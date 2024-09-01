import * as assert from 'assert';
import { describe, test } from 'vitest';
import { utils } from '../src';
import { NUM, STR, NULL, ARR, OBJ, BOOL, TRUE, FALSE, ERROR ,FN_NATIVE } from '../src/interpreter/value';
import { AiScriptRuntimeError } from '../src/error';
import { exe, getMeta, eq } from './testutils';

/*
 * General
 */
describe('terminator', () => {
	describe('top-level', () => {
		test.concurrent('newline', async () => {
			const res = await exe(`
			:: A {
				let x = 1
			}
			:: B {
				let x = 2
			}
			<: A:x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('semi colon', async () => {
			const res = await exe(`
			::A{let x = 1};::B{let x = 2}
			<: A:x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('semi colon of the tail', async () => {
			const res = await exe(`
			::A{let x = 1};
			<: A:x
			`);
			eq(res, NUM(1));
		});
	});

	describe('block', () => {
		test.concurrent('newline', async () => {
			const res = await exe(`
			eval {
				let x = 1
				let y = 2
				<: x + y
			}
			`);
			eq(res, NUM(3));
		});

		test.concurrent('semi colon', async () => {
			const res = await exe(`
			eval{let x=1;let y=2;<:x+y}
			`);
			eq(res, NUM(3));
		});

		test.concurrent('semi colon of the tail', async () => {
			const res = await exe(`
			eval{let x=1;<:x;}
			`);
			eq(res, NUM(1));
		});
	});

	describe('namespace', () => {
		test.concurrent('newline', async () => {
			const res = await exe(`
			:: A {
				let x = 1
				let y = 2
			}
			<: A:x + A:y
			`);
			eq(res, NUM(3));
		});

		test.concurrent('semi colon', async () => {
			const res = await exe(`
			::A{let x=1;let y=2}
			<: A:x + A:y
			`);
			eq(res, NUM(3));
		});

		test.concurrent('semi colon of the tail', async () => {
			const res = await exe(`
			::A{let x=1;}
			<: A:x
			`);
			eq(res, NUM(1));
		});
	});
});

describe('separator', () => {
	describe('match', () => {
		test.concurrent('multi line', async () => {
			const res = await exe(`
			let x = 1
			<: match x {
				case 1 => "a"
				case 2 => "b"
			}
			`);
			eq(res, STR('a'));
		});

		test.concurrent('multi line with semi colon', async () => {
			const res = await exe(`
			let x = 1
			<: match x {
				case 1 => "a",
				case 2 => "b"
			}
			`);
			eq(res, STR('a'));
		});

		test.concurrent('single line', async () => {
			const res = await exe(`
			let x = 1
			<:match x{case 1=>"a",case 2=>"b"}
			`);
			eq(res, STR('a'));
		});

		test.concurrent('single line with tail semi colon', async () => {
			const res = await exe(`
			let x = 1
			<: match x{case 1=>"a",case 2=>"b",}
			`);
			eq(res, STR('a'));
		});

		test.concurrent('multi line (default)', async () => {
			const res = await exe(`
			let x = 3
			<: match x {
				case 1 => "a"
				case 2 => "b"
				default => "c"
			}
			`);
			eq(res, STR('c'));
		});

		test.concurrent('multi line with semi colon (default)', async () => {
			const res = await exe(`
			let x = 3
			<: match x {
				case 1 => "a",
				case 2 => "b",
				default => "c"
			}
			`);
			eq(res, STR('c'));
		});

		test.concurrent('single line (default)', async () => {
			const res = await exe(`
			let x = 3
			<:match x{case 1=>"a",case 2=>"b",default=>"c"}
			`);
			eq(res, STR('c'));
		});

		test.concurrent('single line with tail semi colon (default)', async () => {
			const res = await exe(`
			let x = 3
			<:match x{case 1=>"a",case 2=>"b",default=>"c",}
			`);
			eq(res, STR('c'));
		});
	});

	describe('call', () => {
		test.concurrent('multi line', async () => {
			const res = await exe(`
			@f(a, b, c) {
				a * b + c
			}
			<: f(
				2
				3
				1
			)
			`);
			eq(res, NUM(7));
		});

		test.concurrent('multi line with comma', async () => {
			const res = await exe(`
			@f(a, b, c) {
				a * b + c
			}
			<: f(
				2,
				3,
				1
			)
			`);
			eq(res, NUM(7));
		});

		test.concurrent('single line', async () => {
			const res = await exe(`
			@f(a, b, c) {
				a * b + c
			}
			<:f(2,3,1)
			`);
			eq(res, NUM(7));
		});

		test.concurrent('single line with tail comma', async () => {
			const res = await exe(`
			@f(a, b, c) {
				a * b + c
			}
			<:f(2,3,1,)
			`);
			eq(res, NUM(7));
		});
	});

	describe('obj', () => {
		test.concurrent('multi line', async () => {
			const res = await exe(`
			let x = {
				a: 1
				b: 2
			}
			<: x.b
			`);
			eq(res, NUM(2));
		});

		test.concurrent('multi line, multi newlines', async () => {
			const res = await exe(`
			let x = {

				a: 1

				b: 2

			}
			<: x.b
			`);
			eq(res, NUM(2));
		});

		test.concurrent('multi line with comma', async () => {
			const res = await exe(`
			let x = {
				a: 1,
				b: 2
			}
			<: x.b
			`);
			eq(res, NUM(2));
		});

		test.concurrent('single line', async () => {
			const res = await exe(`
			let x={a:1,b:2}
			<: x.b
			`);
			eq(res, NUM(2));
		});

		test.concurrent('single line with tail comma', async () => {
			const res = await exe(`
			let x={a:1,b:2,}
			<: x.b
			`);
			eq(res, NUM(2));
		});
	});

	describe('arr', () => {
		test.concurrent('multi line', async () => {
			const res = await exe(`
			let x = [
				1
				2
			]
			<: x[1]
			`);
			eq(res, NUM(2));
		});

		test.concurrent('multi line, multi newlines', async () => {
			const res = await exe(`
			let x = [

				1

				2

			]
			<: x[1]
			`);
			eq(res, NUM(2));
		});

		test.concurrent('multi line with comma', async () => {
			const res = await exe(`
			let x = [
				1,
				2
			]
			<: x[1]
			`);
			eq(res, NUM(2));
		});

		test.concurrent('multi line with comma, multi newlines', async () => {
			const res = await exe(`
			let x = [

				1,

				2

			]
			<: x[1]
			`);
			eq(res, NUM(2));
		});

		test.concurrent('multi line with comma and tail comma', async () => {
			const res = await exe(`
			let x = [
				1,
				2,
			]
			<: x[1]
			`);
			eq(res, NUM(2));
		});

		test.concurrent('multi line with comma and tail comma, multi newlines', async () => {
			const res = await exe(`
			let x = [

				1,

				2,

			]
			<: x[1]
			`);
			eq(res, NUM(2));
		});

		test.concurrent('single line', async () => {
			const res = await exe(`
			let x=[1,2]
			<: x[1]
			`);
			eq(res, NUM(2));
		});

		test.concurrent('single line with tail comma', async () => {
			const res = await exe(`
			let x=[1,2,]
			<: x[1]
			`);
			eq(res, NUM(2));
		});
	});

	describe('function params', () => {
		test.concurrent('single line', async () => {
			const res = await exe(`
			@f(a, b) {
				a + b
			}
			<: f(1, 2)
			`);
			eq(res, NUM(3));
		});

		test.concurrent('single line with tail comma', async () => {
			const res = await exe(`
			@f(a, b, ) {
				a + b
			}
			<: f(1, 2)
			`);
			eq(res, NUM(3));
		});

		test.concurrent('multi line', async () => {
			const res = await exe(`
			@f(
				a
				b
			) {
				a + b
			}
			<: f(1, 2)
			`);
			eq(res, NUM(3));
		});

		test.concurrent('multi line with comma', async () => {
			const res = await exe(`
			@f(
				a,
				b
			) {
				a + b
			}
			<: f(1, 2)
			`);
			eq(res, NUM(3));
		});

		test.concurrent('multi line with tail comma', async () => {
			const res = await exe(`
			@f(
				a,
				b,
			) {
				a + b
			}
			<: f(1, 2)
			`);
			eq(res, NUM(3));
		});

		test.concurrent('destructuring param', async () => {
			const res = await exe(`
			@f([a, b]) {
				a + b
			}
			<: f([1, 2])
			`);
			eq(res, NUM(3));
		});
	});
});


describe('Comment', () => {
	test.concurrent('single line comment', async () => {
		const res = await exe(`
		// let a = ...
		let a = 42
		<: a
		`);
		eq(res, NUM(42));
	});

	test.concurrent('multi line comment', async () => {
		const res = await exe(`
		/* variable declaration here...
			let a = ...
		*/
		let a = 42
		<: a
		`);
		eq(res, NUM(42));
	});

	test.concurrent('multi line comment 2', async () => {
		const res = await exe(`
		/* variable declaration here...
			let a = ...
		*/
		let a = 42
		/*
			another comment here
		*/
		<: a
		`);
		eq(res, NUM(42));
	});

	test.concurrent('// as string', async () => {
		const res = await exe('<: "//"');
		eq(res, STR('//'));
	});

	test.concurrent('line tail', async () => {
		const res = await exe(`
		let x = 'a' // comment
		let y = 'b'
		<: x
		`);
		eq(res, STR('a'));
	});
});

describe('lang version', () => {
	test.concurrent('number', async () => {
		const res = utils.getLangVersion(`
		/// @2021
		@f(x) {
			x
		}
		`);
		assert.strictEqual(res, '2021');
	});

	test.concurrent('chars', async () => {
		const res = utils.getLangVersion(`
		/// @ canary
		const a = 1
		@f(x) {
			x
		}
		f(a)
		`);
		assert.strictEqual(res, 'canary');
	});

	test.concurrent('complex', async () => {
		const res = utils.getLangVersion(`
		/// @ 2.0-Alpha
		@f(x) {
			x
		}
		`);
		assert.strictEqual(res, '2.0-Alpha');
	});

	test.concurrent('no specified', async () => {
		const res = utils.getLangVersion(`
		@f(x) {
			x
		}
		`);
		assert.strictEqual(res, null);
	});
});

/*
 * Statements
 */
describe('Cannot put multiple statements in a line', () => {
	test.concurrent('var def', async () => {
		try {
			await exe(`
			let a = 42 let b = 11
			`);
		} catch (e) {
			assert.ok(true);
			return;
		}
		assert.fail();
	});

	test.concurrent('var def (op)', async () => {
		try {
			await exe(`
			let a = 13 + 75 let b = 24 + 146
			`);
		} catch (e) {
			assert.ok(true);
			return;
		}
		assert.fail();
	});

	test.concurrent('var def in block', async () => {
		try {
			await exe(`
			eval {
				let a = 42 let b = 11
			}
			`);
		} catch (e) {
			assert.ok(true);
			return;
		}
		assert.fail();
	});
});

describe('Variable declaration', () => {
	test.concurrent('let', async () => {
		const res = await exe(`
			let a = 42
			<: a
		`);
		eq(res, NUM(42));
	});
	test.concurrent('Do not assign to let (issue #328)', async () => {
		const err = await exe(`
			let hoge = 33
			hoge = 4
		`).then(() => undefined).catch(err => err);

		assert.ok(err instanceof AiScriptRuntimeError);
	});
	test.concurrent('destructuring declaration', async () => {
		const res = await exe(`
			let [a, { value: b }] = [1, { value: 2 }]
			<: [a, b]
		`);
		eq(res, ARR([NUM(1), NUM(2)]));
	});
	test.concurrent('empty function', async () => {
		const res = await exe(`
			@hoge() { }
			<: hoge()
		`);
		eq(res, NULL);
	});
});

describe('Variable assignment', () => {
	test.concurrent('simple', async () => {
		eq(await exe(`
			var hoge = 25
			hoge = 7
			<: hoge
		`), NUM(7));
	});
	test.concurrent('destructuring assignment', async () => {
		eq(await exe(`
			var hoge = 'foo'
			var fuga = { value: 'bar' }
			[{ value: hoge }, fuga] = [fuga, hoge]
			<: [hoge, fuga]
		`), ARR([STR('bar'), STR('foo')]));
	});
});

describe('for', () => {
	test.concurrent('Basic', async () => {
		const res = await exe(`
		var count = 0
		for (let i, 10) {
			count += i + 1
		}
		<: count
		`);
		eq(res, NUM(55));
	});

	test.concurrent('initial value', async () => {
		const res = await exe(`
		var count = 0
		for (let i = 2, 10) {
			count += i
		}
		<: count
		`);
		eq(res, NUM(65));
	});

	test.concurrent('wuthout iterator', async () => {
		const res = await exe(`
		var count = 0
		for (10) {
			count = (count + 1)
		}
		<: count
		`);
		eq(res, NUM(10));
	});

	test.concurrent('without brackets', async () => {
		const res = await exe(`
		var count = 0
		for let i, 10 {
			count = (count + i)
		}
		<: count
		`);
		eq(res, NUM(45));
	});

	test.concurrent('Break', async () => {
		const res = await exe(`
		var count = 0
		for (let i, 20) {
			if (i == 11) break
			count += i
		}
		<: count
		`);
		eq(res, NUM(55));
	});

	test.concurrent('continue', async () => {
		const res = await exe(`
		var count = 0
		for (let i, 10) {
			if (i == 5) continue
			count = (count + 1)
		}
		<: count
		`);
		eq(res, NUM(9));
	});

	test.concurrent('single statement', async () => {
		const res = await exe(`
		var count = 0
		for 10 count += 1
		<: count
		`);
		eq(res, NUM(10));
	});

	test.concurrent('var name without space', async () => {
		try {
			await exe(`
			for (leti, 10) {
				<: i
			}
			`);
		} catch (e) {
			assert.ok(true);
			return;
		}
		assert.fail();
	});
});

describe('each', () => {
	test.concurrent('standard', async () => {
		const res = await exe(`
		let msgs = []
		each let item, ["ai", "chan", "kawaii"] {
			msgs.push([item, "!"].join())
		}
		<: msgs
		`);
		eq(res, ARR([STR('ai!'), STR('chan!'), STR('kawaii!')]));
	});

	test.concurrent('destructuring declaration', async () => {
		const res = await exe(`
			each let { value: a }, [{ value: 1 }] {
				<: a
			}
		`);
		eq(res, NUM(1));
	});

	test.concurrent('Break', async () => {
		const res = await exe(`
		let msgs = []
		each let item, ["ai", "chan", "kawaii", "yo"] {
			if (item == "kawaii") break
			msgs.push([item, "!"].join())
		}
		<: msgs
		`);
		eq(res, ARR([STR('ai!'), STR('chan!')]));
	});

	test.concurrent('single statement', async () => {
		const res = await exe(`
		let msgs = []
		each let item, ["ai", "chan", "kawaii"] msgs.push([item, "!"].join())
		<: msgs
		`);
		eq(res, ARR([STR('ai!'), STR('chan!'), STR('kawaii!')]));
	});

	test.concurrent('var name without space', async () => {
		try {
			await exe(`
			each letitem, ["ai", "chan", "kawaii"] {
				<: item
			}
			`);
		} catch (e) {
			assert.ok(true);
			return;
		}
		assert.fail();
	});
});

describe('while', () => {
	test.concurrent('Basic', async () => {
		const res = await exe(`
		var count = 0
		while count < 42 {
			count += 1
		}
		<: count
		`);
		eq(res, NUM(42));
	});

	test.concurrent('start false', async () => {
		const res = await exe(`
		while false {
			<: 'hoge'
		}
		`);
		eq(res, NULL);
	});
});

describe('do-while', () => {
	test.concurrent('Basic', async () => {
		const res = await exe(`
		var count = 0
		do {
			count += 1
		} while count < 42
		<: count
		`);
		eq(res, NUM(42));
	});

	test.concurrent('start false', async () => {
		const res = await exe(`
		do {
			<: 'hoge'
		} while false
		`);
		eq(res, STR('hoge'));
	});
});

describe('loop', () => {
	test.concurrent('Basic', async () => {
		const res = await exe(`
		var count = 0
		loop {
			if (count == 10) break
			count = (count + 1)
		}
		<: count
		`);
		eq(res, NUM(10));
	});

	test.concurrent('with continue', async () => {
		const res = await exe(`
		var a = ["ai", "chan", "kawaii", "yo", "!"]
		var b = []
		loop {
			var x = a.shift()
			if (x == "chan") continue
			if (x == "yo") break
			b.push(x)
		}
		<: b
		`);
		eq(res, ARR([STR('ai'), STR('kawaii')]));
	});
});

/*
 * Global statements
 */
describe('meta', () => {
	test.concurrent('default meta', async () => {
		const res = getMeta(`
		### { a: 1, b: 2, c: 3, }
		`);
		eq(res, new Map([
			[null, {
				a: 1,
				b: 2,
				c: 3,
			}]
		]));
		eq(res!.get(null), {
			a: 1,
			b: 2,
			c: 3,
		});
	});

	describe('String', () => {
		test.concurrent('valid', async () => {
			const res = getMeta(`
			### x "hoge"
			`);
			eq(res, new Map([
				['x', 'hoge']
			]));
		});
	});

	describe('Number', () => {
		test.concurrent('valid', async () => {
			const res = getMeta(`
			### x 42
			`);
			eq(res, new Map([
				['x', 42]
			]));
		});
	});

	describe('Boolean', () => {
		test.concurrent('valid', async () => {
			const res = getMeta(`
			### x true
			`);
			eq(res, new Map([
				['x', true]
			]));
		});
	});

	describe('Null', () => {
		test.concurrent('valid', async () => {
			const res = getMeta(`
			### x null
			`);
			eq(res, new Map([
				['x', null]
			]));
		});
	});

	describe('Array', () => {
		test.concurrent('valid', async () => {
			const res = getMeta(`
			### x [1, 2, 3]
			`);
			eq(res, new Map([
				['x', [1, 2, 3]]
			]));
		});

		test.concurrent('invalid', async () => {
			try {
				getMeta(`
				### x [1, (2 + 2), 3]
				`);
			} catch (e) {
				assert.ok(true);
				return;
			}
			assert.fail();
		});
	});

	describe('Object', () => {
		test.concurrent('valid', async () => {
			const res = getMeta(`
			### x { a: 1, b: 2, c: 3, }
			`);
			eq(res, new Map([
				['x', {
					a: 1,
					b: 2,
					c: 3,
				}]
			]));
		});

		test.concurrent('invalid', async () => {
			try {
				getMeta(`
				### x { a: 1, b: (2 + 2), c: 3, }
				`);
			} catch (e) {
				assert.ok(true);
				return;
			}
			assert.fail();
		});
	});

	describe('Template', () => {
		test.concurrent('invalid', async () => {
			try {
				getMeta(`
				### x \`foo {bar} baz\`
				`);
			} catch (e) {
				assert.ok(true);
				return;
			}
			assert.fail();
		});
	});

	describe('Expression', () => {
		test.concurrent('invalid', async () => {
			try {
				getMeta(`
				### x (1 + 1)
				`);
			} catch (e) {
				assert.ok(true);
				return;
			}
			assert.fail();
		});
	});
});

describe('namespace', () => {
	test.concurrent('standard', async () => {
		const res = await exe(`
		<: Foo:bar()

		:: Foo {
			@bar() { "ai" }
		}
		`);
		eq(res, STR('ai'));
	});

	test.concurrent('self ref', async () => {
		const res = await exe(`
		<: Foo:bar()

		:: Foo {
			let ai = "kawaii"
			@bar() { ai }
		}
		`);
		eq(res, STR('kawaii'));
	});

	test.concurrent('cannot declare mutable variable', async () => {
		try {
			await exe(`
			:: Foo {
				var ai = "kawaii"
			}
			`);
		} catch (e) {
			assert.ok(true);
			return;
		}
		assert.fail();
	});

	test.concurrent('cannot destructuring declaration', async () => {
		try {
			await exe(`
			:: Foo {
				let [a, b] = [1, 2]
			}
			`);
		} catch {
			assert.ok(true);
			return;
		}
		assert.fail();
	});

	test.concurrent('nested', async () => {
		const res = await exe(`
		<: Foo:Bar:baz()

		:: Foo {
			:: Bar {
				@baz() { "ai" }
			}
		}
		`);
		eq(res, STR('ai'));
	});

	test.concurrent('nested ref', async () => {
		const res = await exe(`
		<: Foo:baz

		:: Foo {
			let baz = Bar:ai
			:: Bar {
				let ai = "kawaii"
			}
		}
		`);
		eq(res, STR('kawaii'));
	});
});

describe('operators', () => {
	test.concurrent('==', async () => {
		eq(await exe('<: (1 == 1)'), BOOL(true));
		eq(await exe('<: (1 == 2)'), BOOL(false));
		eq(await exe('<: (Core:type == Core:type)'), BOOL(true));
		eq(await exe('<: (Core:type == Core:gt)'), BOOL(false));
		eq(await exe('<: (@(){} == @(){})'), BOOL(false));
		eq(await exe('<: (Core:eq == @(){})'), BOOL(false));
		eq(await exe(`
			let f = @(){}
			let g = f

			<: (f == g)
		`), BOOL(true));
	});

	test.concurrent('!=', async () => {
		eq(await exe('<: (1 != 2)'), BOOL(true));
		eq(await exe('<: (1 != 1)'), BOOL(false));
	});

	test.concurrent('&&', async () => {
		eq(await exe('<: (true && true)'), BOOL(true));
		eq(await exe('<: (true && false)'), BOOL(false));
		eq(await exe('<: (false && true)'), BOOL(false));
		eq(await exe('<: (false && false)'), BOOL(false));
		eq(await exe('<: (false && null)'), BOOL(false));
		try {
			await exe('<: (true && null)');
		} catch (e) {
			assert.ok(e instanceof AiScriptRuntimeError);
			return;
		}

		eq(
			await exe(`
				var tmp = null

				@func() {
					tmp = true
					return true
				}

				false && func()

				<: tmp
			`),
			NULL
		)

		eq(
			await exe(`
				var tmp = null

				@func() {
					tmp = true
					return true
				}

				true && func()

				<: tmp
			`),
			BOOL(true)
		)

		assert.fail();
	});

	test.concurrent('||', async () => {
		eq(await exe('<: (true || true)'), BOOL(true));
		eq(await exe('<: (true || false)'), BOOL(true));
		eq(await exe('<: (false || true)'), BOOL(true));
		eq(await exe('<: (false || false)'), BOOL(false));
		eq(await exe('<: (true || null)'), BOOL(true));
		try {
			await exe('<: (false || null)');
		} catch (e) {
			assert.ok(e instanceof AiScriptRuntimeError);
			return;
		}

		eq(
			await exe(`
				var tmp = null

				@func() {
					tmp = true
					return true
				}

				true || func()

				<: tmp
			`),
			NULL
		)

		eq(
			await exe(`
				var tmp = null

				@func() {
					tmp = true
					return true
				}

				false || func()

				<: tmp
			`),
			BOOL(true)
		)

		assert.fail();
	});

	test.concurrent('+', async () => {
		eq(await exe('<: (1 + 1)'), NUM(2));
	});

	test.concurrent('-', async () => {
		eq(await exe('<: (1 - 1)'), NUM(0));
	});

	test.concurrent('*', async () => {
		eq(await exe('<: (1 * 1)'), NUM(1));
	});

	test.concurrent('^', async () => {
		eq(await exe('<: (1 ^ 0)'), NUM(1));
	});

	test.concurrent('/', async () => {
		eq(await exe('<: (1 / 1)'), NUM(1));
	});

	test.concurrent('%', async () => {
		eq(await exe('<: (1 % 1)'), NUM(0));
	});

	test.concurrent('>', async () => {
		eq(await exe('<: (2 > 1)'), BOOL(true));
		eq(await exe('<: (1 > 1)'), BOOL(false));
		eq(await exe('<: (0 > 1)'), BOOL(false));
	});

	test.concurrent('<', async () => {
		eq(await exe('<: (2 < 1)'), BOOL(false));
		eq(await exe('<: (1 < 1)'), BOOL(false));
		eq(await exe('<: (0 < 1)'), BOOL(true));
	});

	test.concurrent('>=', async () => {
		eq(await exe('<: (2 >= 1)'), BOOL(true));
		eq(await exe('<: (1 >= 1)'), BOOL(true));
		eq(await exe('<: (0 >= 1)'), BOOL(false));
	});

	test.concurrent('<=', async () => {
		eq(await exe('<: (2 <= 1)'), BOOL(false));
		eq(await exe('<: (1 <= 1)'), BOOL(true));
		eq(await exe('<: (0 <= 1)'), BOOL(true));
	});

	test.concurrent('precedence', async () => {
		eq(await exe('<: 1 + 2 * 3 + 4'), NUM(11));
		eq(await exe('<: 1 + 4 / 4 + 1'), NUM(3));
		eq(await exe('<: 1 + 1 == 2 && 2 * 2 == 4'), BOOL(true));
		eq(await exe('<: (1 + 1) * 2'), NUM(4));
	});

	test.concurrent('negative numbers', async () => {
		eq(await exe('<: 1+-1'), NUM(0));
		eq(await exe('<: 1--1'), NUM(2));//反直観的、禁止される可能性がある？
		eq(await exe('<: -1*-1'), NUM(1));
		eq(await exe('<: -1==-1'), BOOL(true));
		eq(await exe('<: 1>-1'), BOOL(true));
		eq(await exe('<: -1<1'), BOOL(true));
	});

});

describe('not', () => {
	test.concurrent('Basic', async () => {
		const res = await exe(`
		<: !true
		`);
		eq(res, BOOL(false));
	});
});

describe('Infix expression', () => {
	test.concurrent('simple infix expression', async () => {
		eq(await exe('<: 0 < 1'), BOOL(true));
		eq(await exe('<: 1 + 1'), NUM(2));
	});

	test.concurrent('combination', async () => {
		eq(await exe('<: 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10'), NUM(55));
		eq(await exe('<: Core:add(1, 3) * Core:mul(2, 5)'), NUM(40));
	});

	test.concurrent('use parentheses to distinguish expr', async () => {
		eq(await exe('<: (1 + 10) * (2 + 5)'), NUM(77));
	});

	test.concurrent('syntax symbols vs infix operators', async () => {
		const res = await exe(`
		<: match true {
			case 1 == 1 => "true"
			case 1 < 1 => "false"
		}
		`);
		eq(res, STR('true'));
	});

	test.concurrent('number + if expression', async () => {
		eq(await exe('<: 1 + if true 1 else 2'), NUM(2));
	});

	test.concurrent('number + match expression', async () => {
		const res = await exe(`
			<: 1 + match 2 == 2 {
				case true => 3
				case false => 4
			}
		`);
		eq(res, NUM(4));
	});

	test.concurrent('eval + eval', async () => {
		eq(await exe('<: eval { 1 } + eval { 1 }'), NUM(2));
	});

	test.concurrent('disallow line break', async () => {
		try {
			await exe(`
			<: 1 +
			1 + 1
			`);
		} catch (e) {
			assert.ok(true);
			return;
		}
		assert.fail();
	});

	test.concurrent('escaped line break', async () => {
		eq(await exe(`
			<: 1 + \\
			1 + 1
		`), NUM(3));
	});

	test.concurrent('infix-to-fncall on namespace', async () => {
		eq(
			await exe(`
				:: Hoge {
					@add(x, y) {
						x + y
					}
				}
				<: Hoge:add(1, 2)
			`),
			NUM(3)
		);
	});
});

describe('if', () => {
	test.concurrent('if', async () => {
		const res1 = await exe(`
		var msg = "ai"
		if true {
			msg = "kawaii"
		}
		<: msg
		`);
		eq(res1, STR('kawaii'));

		const res2 = await exe(`
		var msg = "ai"
		if false {
			msg = "kawaii"
		}
		<: msg
		`);
		eq(res2, STR('ai'));
	});

	test.concurrent('else', async () => {
		const res1 = await exe(`
		var msg = null
		if true {
			msg = "ai"
		} else {
			msg = "kawaii"
		}
		<: msg
		`);
		eq(res1, STR('ai'));

		const res2 = await exe(`
		var msg = null
		if false {
			msg = "ai"
		} else {
			msg = "kawaii"
		}
		<: msg
		`);
		eq(res2, STR('kawaii'));
	});

	test.concurrent('elif', async () => {
		const res1 = await exe(`
		var msg = "bebeyo"
		if false {
			msg = "ai"
		} elif true {
			msg = "kawaii"
		}
		<: msg
		`);
		eq(res1, STR('kawaii'));

		const res2 = await exe(`
		var msg = "bebeyo"
		if false {
			msg = "ai"
		} elif false {
			msg = "kawaii"
		}
		<: msg
		`);
		eq(res2, STR('bebeyo'));
	});

	test.concurrent('if ~ elif ~ else', async () => {
		const res1 = await exe(`
		var msg = null
		if false {
			msg = "ai"
		} elif true {
			msg = "chan"
		} else {
			msg = "kawaii"
		}
		<: msg
		`);
		eq(res1, STR('chan'));

		const res2 = await exe(`
		var msg = null
		if false {
			msg = "ai"
		} elif false {
			msg = "chan"
		} else {
			msg = "kawaii"
		}
		<: msg
		`);
		eq(res2, STR('kawaii'));
	});

	test.concurrent('expr', async () => {
		const res1 = await exe(`
		<: if true "ai" else "kawaii"
		`);
		eq(res1, STR('ai'));

		const res2 = await exe(`
		<: if false "ai" else "kawaii"
		`);
		eq(res2, STR('kawaii'));
	});
});

describe('eval', () => {
	test.concurrent('returns value', async () => {
		const res = await exe(`
		let foo = eval {
			let a = 1
			let b = 2
			(a + b)
		}

		<: foo
		`);
		eq(res, NUM(3));
	});
});

describe('match', () => {
	test.concurrent('Basic', async () => {
		const res = await exe(`
		<: match 2 {
			case 1 => "a"
			case 2 => "b"
			case 3 => "c"
		}
		`);
		eq(res, STR('b'));
	});

	test.concurrent('When default not provided, returns null', async () => {
		const res = await exe(`
		<: match 42 {
			case 1 => "a"
			case 2 => "b"
			case 3 => "c"
		}
		`);
		eq(res, NULL);
	});

	test.concurrent('With default', async () => {
		const res = await exe(`
		<: match 42 {
			case 1 => "a"
			case 2 => "b"
			case 3 => "c"
			default => "d"
		}
		`);
		eq(res, STR('d'));
	});

	test.concurrent('With block', async () => {
		const res = await exe(`
		<: match 2 {
			case 1 => 1
			case 2 => {
				let a = 1
				let b = 2
				(a + b)
			}
			case 3 => 3
		}
		`);
		eq(res, NUM(3));
	});

	test.concurrent('With return', async () => {
		const res = await exe(`
		@f(x) {
			match x {
				case 1 => {
					return "ai"
				}
			}
			"foo"
		}
		<: f(1)
		`);
		eq(res, STR('ai'));
	});
});

describe('exists', () => {
	test.concurrent('Basic', async () => {
		const res = await exe(`
		let foo = null
		<: [(exists foo), (exists bar)]
		`);
		eq(res, ARR([BOOL(true), BOOL(false)]));
	});
});

