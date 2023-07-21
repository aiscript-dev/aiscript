/* eslint-disable prefer-const */
/**
 * Tests!
 */

import * as assert from 'assert';
import { Parser, Interpreter, utils, errors, Ast } from '../src';
import { NUM, STR, NULL, ARR, OBJ, BOOL, TRUE, FALSE } from '../src/interpreter/value';
import { RuntimeError } from '../src/error';

const exe = (program: string): Promise<any> => new Promise((ok, err) => {
	const aiscript = new Interpreter({}, {
		out(value) {
			ok(value);
		},
		maxStep: 9999,
	});

	const parser = new Parser();
	const ast = parser.parse(program);
	aiscript.exec(ast).catch(err);
});

const getMeta = (program: string) => {
	const parser = new Parser();
	const ast = parser.parse(program);

	const metadata = Interpreter.collectMetadata(ast);

	return metadata;
};

const eq = (a, b) => {
	assert.deepEqual(a.type, b.type);
	assert.deepEqual(a.value, b.value);
};

test.concurrent('Hello, world!', async () => {
	const res = await exe('<: "Hello, world!"');
	eq(res, STR('Hello, world!'));
});

test.concurrent('empty script', async () => {
	const parser = new Parser();
	const ast = parser.parse('');
	assert.deepEqual(ast, []);
});

describe('Interpreter', () => {
	describe('Scope', () => {
		test.concurrent('getAll', async () => {
			const aiscript = new Interpreter({});
			await aiscript.exec(Parser.parse(`
			let a = 1
			@b() {
				let x = a + 1
				x
			}
			if true {
				var y = 2
			}
			var c = true
			`));
			const vars = aiscript.scope.getAll();
			assert.ok(vars.get('a') != null);
			assert.ok(vars.get('b') != null);
			assert.ok(vars.get('c') != null);
			assert.ok(vars.get('x') == null);
			assert.ok(vars.get('y') == null);
		});

		test.concurrent('namespace', async () => {
			eq(
				await exe(`
					:: Hoge {
						var value = 1
						@func1() { value += 1 }
						@func2() { value = 10 }
						@func3() { value -= 1 }
					}

					var res = [Hoge:value]

					Hoge:func1()
					res.push(Hoge:value)

					Hoge:func2()
					res.push(Hoge:value)

					Hoge:func3()
					res.push(Hoge:value)

					<: res
				`),
				ARR([NUM(1), NUM(2), NUM(10), NUM(9)])
			)
		});
	});
});

describe('ops', () => {
	test.concurrent('==', async () => {
		eq(await exe('<: (1 == 1)'), BOOL(true));
		eq(await exe('<: (1 == 2)'), BOOL(false));
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
			if (!(e instanceof RuntimeError)) assert.fail();
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
			if (!(e instanceof RuntimeError)) assert.fail();
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
			1 == 1 => "true"
			1 < 1 => "false"
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
				true => 3
				false  => 4
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
});

test.concurrent('式にコロンがあってもオブジェクトと判定されない', async () => {
	const res = await exe(`
	<: eval {
		Core:eq("ai", "ai")
	}
	`);
	eq(res, BOOL(true));
});

test.concurrent('inc', async () => {
	const res = await exe(`
	var a = 0
	a += 1
	a += 2
	a += 3
	<: a
	`);
	eq(res, NUM(6));
});

test.concurrent('dec', async () => {
	const res = await exe(`
	var a = 0
	a -= 1
	a -= 2
	a -= 3
	<: a
	`);
	eq(res, NUM(-6));
});

test.concurrent('var', async () => {
	const res = await exe(`
	let a = 42
	<: a
	`);
	eq(res, NUM(42));
});

test.concurrent('参照が繋がらない', async () => {
	const res = await exe(`
	var f = @() { "a" }
	var g = f
	f = @() { "b" }

	<: g()
	`);
	eq(res, STR('a'));
});

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
});

test.concurrent('empty function', async () => {
	const res = await exe(`
	@hoge() { }
	<: hoge()
	`);
	eq(res, NULL);
});

test.concurrent('empty lambda', async () => {
	const res = await exe(`
	let hoge = @() { }
	<: hoge()
	`);
	eq(res, NULL);
});

test.concurrent('lambda that returns an object', async () => {
	const res = await exe(`
	let hoge = @() {{}}
	<: hoge()
	`);
	eq(res, OBJ(new Map()));
});

test.concurrent('Closure', async () => {
	const res = await exe(`
	@store(v) {
		let state = v
		@() {
			state
		}
	}
	let s = store("ai")
	<: s()
	`);
	eq(res, STR('ai'));
});

test.concurrent('Closure (counter)', async () => {
	const res = await exe(`
	@create_counter() {
		var count = 0
		{
			get_count: @() { count };
			count: @() { count = (count + 1) };
		}
	}

	let counter = create_counter()
	let get_count = counter.get_count
	let count = counter.count

	count()
	count()
	count()

	<: get_count()
	`);
	eq(res, NUM(3));
});

test.concurrent('Recursion', async () => {
	const res = await exe(`
	@fact(n) {
		if (n == 0) { 1 } else { (fact((n - 1)) * n) }
	}

	<: fact(5)
	`);
	eq(res, NUM(120));
});

describe('Var name starts with reserved word', () => {
	test.concurrent('let', async () => {
		const res = await exe(`
		@f() {
			let letcat = "ai"
			letcat
		}
		<: f()
		`);
		eq(res, STR('ai'));
	});

	test.concurrent('var', async () => {
		const res = await exe(`
		@f() {
			let varcat = "ai"
			varcat
		}
		<: f()
		`);
		eq(res, STR('ai'));
	});

	test.concurrent('return', async () => {
		const res = await exe(`
		@f() {
			let returncat = "ai"
			returncat
		}
		<: f()
		`);
		eq(res, STR('ai'));
	});

	test.concurrent('each', async () => {
		const res = await exe(`
		@f() {
			let eachcat = "ai"
			eachcat
		}
		<: f()
		`);
		eq(res, STR('ai'));
	});

	test.concurrent('for', async () => {
		const res = await exe(`
		@f() {
			let forcat = "ai"
			forcat
		}
		<: f()
		`);
		eq(res, STR('ai'));
	});

	test.concurrent('loop', async () => {
		const res = await exe(`
		@f() {
			let loopcat = "ai"
			loopcat
		}
		<: f()
		`);
		eq(res, STR('ai'));
	});

	test.concurrent('break', async () => {
		const res = await exe(`
		@f() {
			let breakcat = "ai"
			breakcat
		}
		<: f()
		`);
		eq(res, STR('ai'));
	});

	test.concurrent('continue', async () => {
		const res = await exe(`
		@f() {
			let continuecat = "ai"
			continuecat
		}
		<: f()
		`);
		eq(res, STR('ai'));
	});

	test.concurrent('if', async () => {
		const res = await exe(`
		@f() {
			let ifcat = "ai"
			ifcat
		}
		<: f()
		`);
		eq(res, STR('ai'));
	});

	test.concurrent('match', async () => {
		const res = await exe(`
		@f() {
			let matchcat = "ai"
			matchcat
		}
		<: f()
		`);
		eq(res, STR('ai'));
	});

	test.concurrent('true', async () => {
		const res = await exe(`
		@f() {
			let truecat = "ai"
			truecat
		}
		<: f()
		`);
		eq(res, STR('ai'));
	});

	test.concurrent('false', async () => {
		const res = await exe(`
		@f() {
			let falsecat = "ai"
			falsecat
		}
		<: f()
		`);
		eq(res, STR('ai'));
	});

	test.concurrent('null', async () => {
		const res = await exe(`
		@f() {
			let nullcat = "ai"
			nullcat
		}
		<: f()
		`);
		eq(res, STR('ai'));
	});
});

describe('name validation of reserved word', () => {
	test.concurrent('def', async () => {
		try {
			await exe(`
			let let = 1
			`);
		} catch (e) {
			assert.ok(true);
			return;
		}
		assert.fail();
	});

	test.concurrent('attr', async () => {
		try {
			await exe(`
			#[let 1]
			@f() { 1 }
			`);
		} catch (e) {
			assert.ok(true);
			return;
		}
		assert.fail();
	});

	test.concurrent('ns', async () => {
		try {
			await exe(`
			:: let {
				@f() { 1 }
			}
			`);
		} catch (e) {
			assert.ok(true);
			return;
		}
		assert.fail();
	});

	test.concurrent('var', async () => {
		try {
			await exe(`
			let
			`);
		} catch (e) {
			assert.ok(true);
			return;
		}
		assert.fail();
	});

	test.concurrent('prop', async () => {
		try {
			await exe(`
			let x = { let: 1 }
			x.let
			`);
		} catch (e) {
			assert.ok(true);
			return;
		}
		assert.fail();
	});

	test.concurrent('meta', async () => {
		try {
			await exe(`
			### let 1
			`);
		} catch (e) {
			assert.ok(true);
			return;
		}
		assert.fail();
	});

	test.concurrent('fn', async () => {
		try {
			await exe(`
			@let() { 1 }
			`);
		} catch (e) {
			assert.ok(true);
			return;
		}
		assert.fail();
	});
});

describe('Object', () => {
	test.concurrent('property access', async () => {
		const res = await exe(`
		let obj = {
			a: {
				b: {
					c: 42;
				};
			};
		}

		<: obj.a.b.c
		`);
		eq(res, NUM(42));
	});

	test.concurrent('property access (fn call)', async () => {
		const res = await exe(`
		@f() { 42 }

		let obj = {
			a: {
				b: {
					c: f;
				};
			};
		}

		<: obj.a.b.c()
		`);
		eq(res, NUM(42));
	});

	test.concurrent('property assign', async () => {
		const res = await exe(`
		let obj = {
			a: 1
			b: {
				c: 2
				d: {
					e: 3
				}
			}
		}

		obj.a = 24
		obj.b.d.e = 42

		<: obj
		`);
		eq(res, OBJ(new Map<string, any>([
			['a', NUM(24)],
			['b', OBJ(new Map<string, any>([
				['c', NUM(2)],
				['d', OBJ(new Map<string, any>([
					['e', NUM(42)],
				]))],
			]))],
		])));
	});

	/* 未実装
	test.concurrent('string key', async () => {
		const res = await exe(`
		let obj = {
			"藍": 42;
		}

		<: obj."藍"
		`);
		eq(res, NUM(42));
	});

	test.concurrent('string key including colon and period', async () => {
		const res = await exe(`
		let obj = {
			":.:": 42;
		}

		<: obj.":.:"
		`);
		eq(res, NUM(42));
	});

	test.concurrent('expression key', async () => {
		const res = await exe(`
		let key = "藍"

		let obj = {
			<key>: 42;
		}

		<: obj<key>
		`);
		eq(res, NUM(42));
	});
	*/
});

describe('Array', () => {
	test.concurrent('Array item access', async () => {
		const res = await exe(`
		let arr = ["ai", "chan", "kawaii"]

		<: arr[1]
		`);
		eq(res, STR('chan'));
	});

	test.concurrent('Array item assign', async () => {
		const res = await exe(`
		let arr = ["ai", "chan", "kawaii"]

		arr[1] = "taso"

		<: arr
		`);
		eq(res, ARR([STR('ai'), STR('taso'), STR('kawaii')]));
	});

	test.concurrent('Assign array item to out of range', async () => {
		try {
			await exe(`
					let arr = [1, 2, 3]

					arr[3] = 4

					<: null
				`)
		} catch (e) {
			eq(e instanceof errors.IndexOutOfRangeError, false);
		}

		try {
			await exe(`
					let arr = [1, 2, 3]

					arr[9] = 10

					<: null
				`)
		} catch (e) {
			eq(e instanceof errors.IndexOutOfRangeError, true);
		}
	});

	test.concurrent('index out of range error', async () => {
		try {
			await exe(`
			<: [42][1]
			`);
		} catch (e) {
			assert.equal(e instanceof errors.IndexOutOfRangeError, true);
			return;
		}
		assert.fail();
	});
});

describe('chain', () => {
	test.concurrent('chain access (prop + index + call)', async () => {
		const res = await exe(`
		let obj = {
			a: {
				b: [@(name) { name }, @(str) { "chan" }, @() { "kawaii" }];
			};
		}

		<: obj.a.b[0]("ai")
		`);
		eq(res, STR('ai'));
	});

	test.concurrent('chained assign left side (prop + index)', async () => {
		const res = await exe(`
		let obj = {
			a: {
				b: ["ai", "chan", "kawaii"];
			};
		}

		obj.a.b[1] = "taso"

		<: obj
		`);
		eq(res, OBJ(new Map([
			['a', OBJ(new Map([
				['b', ARR([STR('ai'), STR('taso'), STR('kawaii')])]
			]))]
		])));
	});

	test.concurrent('chained assign right side (prop + index + call)', async () => {
		const res = await exe(`
		let obj = {
			a: {
				b: ["ai", "chan", "kawaii"];
			};
		}

		var x = null
		x = obj.a.b[1]

		<: x
		`);
		eq(res, STR('chan'));
	});

	test.concurrent('chained inc/dec left side (index + prop)', async () => {
		const res = await exe(`
		let arr = [
			{
				a: 1;
				b: 2;
			}
		]

		arr[0].a += 1
		arr[0].b -= 1

		<: arr
		`);
		eq(res, ARR([
			OBJ(new Map([
				['a', NUM(2)],
				['b', NUM(1)]
			]))
		]));
	});

	test.concurrent('chained inc/dec left side (prop + index)', async () => {
		const res = await exe(`
		let obj = {
			a: {
				b: [1, 2, 3];
			};
		}

		obj.a.b[1] += 1
		obj.a.b[2] -= 1

		<: obj
		`);
		eq(res, OBJ(new Map([
			['a', OBJ(new Map([
				['b', ARR([NUM(1), NUM(3), NUM(2)])]
			]))]
		])));
	});

	test.concurrent('prop in def', async () => {
		const res = await exe(`
		let x = @() {
			let obj = {
				a: 1
			}
			obj.a
		}

		<: x()
		`);
		eq(res, NUM(1));
	});

	test.concurrent('prop in return', async () => {
		const res = await exe(`
		let x = @() {
			let obj = {
				a: 1
			}
			return obj.a
			2
		}

		<: x()
		`);
		eq(res, NUM(1));
	});

	test.concurrent('prop in each', async () => {
		const res = await exe(`
		let msgs = []
		let x = { a: ["ai", "chan", "kawaii"] }
		each let item, x.a {
			let y = { a: item }
			msgs.push([y.a, "!"].join())
		}
		<: msgs
		`);
		eq(res, ARR([STR('ai!'), STR('chan!'), STR('kawaii!')]));
	});

	test.concurrent('prop in for', async () => {
		const res = await exe(`
		let x = { times: 10, count: 0 }
		for (let i, x.times) {
			x.count = (x.count + i)
		}
		<: x.count
		`);
		eq(res, NUM(45));
	});
});

describe('Template syntax', () => {
	test.concurrent('Basic', async () => {
		const res = await exe(`
		let str = "kawaii"
		<: \`Ai is {str}!\`
		`);
		eq(res, STR('Ai is kawaii!'));
	});

	test.concurrent('convert to str', async () => {
		const res = await exe(`
		<: \`1 + 1 = {(1 + 1)}\`
		`);
		eq(res, STR('1 + 1 = 2'));
	});

	test.concurrent('invalid', async () => {
		try {
			await exe(`
			<: \`{hoge}\`
			`);
		} catch (e) {
			assert.ok(true);
			return;
		}
		assert.fail();
	});

	test.concurrent('Escape', async () => {
		const res = await exe(`
		let message = "Hello"
		<: \`\\\`a\\{b\\}c\\\`\`
		`);
		eq(res, STR('`a{b}c`'));
	});
});

test.concurrent('Throws error when divided by zero', async () => {
	try {
		await exe(`
		<: (0 / 0)
		`);
	} catch (e) {
		assert.ok(true);
		return;
	}
	assert.fail();
});

describe('Function call', () => {
	test.concurrent('without args', async () => {
		const res = await exe(`
		@f() {
			42
		}
		<: f()
		`);
		eq(res, NUM(42));
	});

	test.concurrent('with args', async () => {
		const res = await exe(`
		@f(x) {
			x
		}
		<: f(42)
		`);
		eq(res, NUM(42));
	});

	test.concurrent('with args (separated by comma)', async () => {
		const res = await exe(`
		@f(x, y) {
			(x + y)
		}
		<: f(1, 1)
		`);
		eq(res, NUM(2));
	});

	test.concurrent('with args (separated by space)', async () => {
		const res = await exe(`
		@f(x y) {
			(x + y)
		}
		<: f(1 1)
		`);
		eq(res, NUM(2));
	});

	test.concurrent('std: throw AiScript error when required arg missing', async () => {
		try {
			await exe(`
			<: Core:eq(1)
			`);
		} catch (e) {
			assert.equal(e instanceof errors.RuntimeError, true);
			return;
		}
		assert.fail();
	});
});

describe('Return', () => {
	test.concurrent('Early return', async () => {
		const res = await exe(`
		@f() {
			if true {
				return "ai"
			}

			"pope"
		}
		<: f()
		`);
		eq(res, STR('ai'));
	});

	test.concurrent('Early return (nested)', async () => {
		const res = await exe(`
		@f() {
			if true {
				if true {
					return "ai"
				}
			}

			"pope"
		}
		<: f()
		`);
		eq(res, STR('ai'));
	});

	test.concurrent('Early return (nested) 2', async () => {
		const res = await exe(`
		@f() {
			if true {
				return "ai"
			}

			"pope"
		}

		@g() {
			if (f() == "ai") {
				return "kawaii"
			}

			"pope"
		}

		<: g()
		`);
		eq(res, STR('kawaii'));
	});

	test.concurrent('Early return without block', async () => {
		const res = await exe(`
		@f() {
			if true return "ai"

			"pope"
		}
		<: f()
		`);
		eq(res, STR('ai'));
	});

	test.concurrent('return inside for', async () => {
		const res = await exe(`
		@f() {
			var count = 0
			for (let i, 100) {
				count += 1
				if (i == 42) {
					return count
				}
			}
		}
		<: f()
		`);
		eq(res, NUM(43));
	});

	test.concurrent('return inside for 2', async () => {
		const res = await exe(`
		@f() {
			for (let i, 10) {
				return 1
			}
			2
		}
		<: f()
		`);
		eq(res, NUM(1));
	});

	test.concurrent('return inside loop', async () => {
		const res = await exe(`
		@f() {
			var count = 0
			loop {
				count += 1
				if (count == 42) {
					return count
				}
			}
		}
		<: f()
		`);
		eq(res, NUM(42));
	});

	test.concurrent('return inside loop 2', async () => {
		const res = await exe(`
		@f() {
			loop {
				return 1
			}
			2
		}
		<: f()
		`);
		eq(res, NUM(1));
	});

	test.concurrent('return inside each', async () =>
	{
		const res = await exe(`
		@f() {
			var count = 0
			each (let item, ["ai", "chan", "kawaii"]) {
				count += 1
				if (item == "chan") {
					return count
				}
			}
		}
		<: f()
		`);
		eq(res, NUM(2));
	});

	test.concurrent('return inside each 2', async () =>
	{
		const res = await exe(`
		@f() {
			each (let item, ["ai", "chan", "kawaii"]) {
				return 1
			}
			2
		}
		<: f()
		`);
		eq(res, NUM(1));
	});
});

describe('Eval', () => {
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

describe('match', () => {
	test.concurrent('Basic', async () => {
		const res = await exe(`
		<: match 2 {
			1 => "a"
			2 => "b"
			3 => "c"
		}
		`);
		eq(res, STR('b'));
	});

	test.concurrent('When default not provided, returns null', async () => {
		const res = await exe(`
		<: match 42 {
			1 => "a"
			2 => "b"
			3 => "c"
		}
		`);
		eq(res, NULL);
	});

	test.concurrent('With default', async () => {
		const res = await exe(`
		<: match 42 {
			1 => "a"
			2 => "b"
			3 => "c"
			* => "d"
		}
		`);
		eq(res, STR('d'));
	});

	test.concurrent('With block', async () => {
		const res = await exe(`
		<: match 2 {
			1 => 1
			2 => {
				let a = 1
				let b = 2
				(a + b)
			}
			3 => 3
		}
		`);
		eq(res, NUM(3));
	});

	test.concurrent('With return', async () => {
		const res = await exe(`
		@f(x) {
			match x {
				1 => {
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
		var a = ["ai" "chan" "kawaii" "yo" "!"]
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

describe('for of', () => {
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

	test.concurrent('Break', async () => {
		const res = await exe(`
		let msgs = []
		each let item, ["ai", "chan", "kawaii" "yo"] {
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

describe('not', () => {
	test.concurrent('Basic', async () => {
		const res = await exe(`
		<: !true
		`);
		eq(res, BOOL(false));
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

	test.concurrent('assign variable', async () => {
		const res = await exe(`
		Foo:setMsg("hello")
		<: Foo:getMsg()

		:: Foo {
			var msg = "ai"
			@setMsg(value) { Foo:msg = value }
			@getMsg() { Foo:msg }
		}
		`);
		eq(res, STR('hello'));
	});

	test.concurrent('increment', async () => {
		const res = await exe(`
		Foo:value += 10
		Foo:value -= 5
		<: Foo:value

		:: Foo {
			var value = 0
		}
		`);
		eq(res, NUM(5));
	});
});

describe('literal', () => {
	test.concurrent('string (single quote)', async () => {
		const res = await exe(`
		<: 'foo'
		`);
		eq(res, STR('foo'));
	});

	test.concurrent('string (double quote)', async () => {
		const res = await exe(`
		<: "foo"
		`);
		eq(res, STR('foo'));
	});

	test.concurrent('Escaped double quote', async () => {
		const res = await exe('<: "ai saw a note \\"bebeyo\\"."');
		eq(res, STR('ai saw a note "bebeyo".'));
	});

	test.concurrent('Escaped single quote', async () => {
		const res = await exe('<: \'ai saw a note \\\'bebeyo\\\'.\'');
		eq(res, STR('ai saw a note \'bebeyo\'.'));
	});

	test.concurrent('bool (true)', async () => {
		const res = await exe(`
		<: true
		`);
		eq(res, BOOL(true));
	});

	test.concurrent('bool (false)', async () => {
		const res = await exe(`
		<: false
		`);
		eq(res, BOOL(false));
	});

	test.concurrent('number (Int)', async () => {
		const res = await exe(`
		<: 10
		`);
		eq(res, NUM(10));
	});

	test.concurrent('number (Float)', async () => {
		const res = await exe(`
		<: 0.5
		`);
		eq(res, NUM(0.5));
	});

	test.concurrent('arr (separated by comma)', async () => {
		const res = await exe(`
		<: [1, 2, 3]
		`);
		eq(res, ARR([NUM(1), NUM(2), NUM(3)]));
	});

	test.concurrent('arr (separated by comma) (with trailing comma)', async () => {
		const res = await exe(`
		<: [1, 2, 3,]
		`);
		eq(res, ARR([NUM(1), NUM(2), NUM(3)]));
	});

	test.concurrent('arr (separated by line break)', async () => {
		const res = await exe(`
		<: [
			1
			2
			3
		]
		`);
		eq(res, ARR([NUM(1), NUM(2), NUM(3)]));
	});

	test.concurrent('arr (separated by line break and comma)', async () => {
		const res = await exe(`
		<: [
			1,
			2,
			3
		]
		`);
		eq(res, ARR([NUM(1), NUM(2), NUM(3)]));
	});

	test.concurrent('arr (separated by line break and comma) (with trailing comma)', async () => {
		const res = await exe(`
		<: [
			1,
			2,
			3,
		]
		`);
		eq(res, ARR([NUM(1), NUM(2), NUM(3)]));
	});

	test.concurrent('obj (separated by comma)', async () => {
		const res = await exe(`
		<: { a: 1, b: 2, c: 3 }
		`);
		eq(res, OBJ(new Map([['a', NUM(1)], ['b', NUM(2)], ['c', NUM(3)]])));
	});

	test.concurrent('obj (separated by comma) (with trailing comma)', async () => {
		const res = await exe(`
		<: { a: 1, b: 2, c: 3, }
		`);
		eq(res, OBJ(new Map([['a', NUM(1)], ['b', NUM(2)], ['c', NUM(3)]])));
	});

	test.concurrent('obj (separated by semicolon)', async () => {
		const res = await exe(`
		<: { a: 1; b: 2; c: 3 }
		`);
		eq(res, OBJ(new Map([['a', NUM(1)], ['b', NUM(2)], ['c', NUM(3)]])));
	});

	test.concurrent('obj (separated by semicolon) (with trailing semicolon)', async () => {
		const res = await exe(`
		<: { a: 1; b: 2; c: 3; }
		`);
		eq(res, OBJ(new Map([['a', NUM(1)], ['b', NUM(2)], ['c', NUM(3)]])));
	});

	test.concurrent('obj (separated by line break)', async () => {
		const res = await exe(`
		<: {
			a: 1
			b: 2
			c: 3
		}
		`);
		eq(res, OBJ(new Map([['a', NUM(1)], ['b', NUM(2)], ['c', NUM(3)]])));
	});

	test.concurrent('obj (separated by line break and semicolon)', async () => {
		const res = await exe(`
		<: {
			a: 1;
			b: 2;
			c: 3
		}
		`);
		eq(res, OBJ(new Map([['a', NUM(1)], ['b', NUM(2)], ['c', NUM(3)]])));
	});

	test.concurrent('obj (separated by line break and semicolon) (with trailing semicolon)', async () => {
		const res = await exe(`
		<: {
			a: 1;
			b: 2;
			c: 3;
		}
		`);
		eq(res, OBJ(new Map([['a', NUM(1)], ['b', NUM(2)], ['c', NUM(3)]])));
	});

	test.concurrent('obj and arr (separated by line break)', async () => {
		const res = await exe(`
		<: {
			a: 1
			b: [
				1
				2
				3
			]
			c: 3
		}
		`);
		eq(res, OBJ(new Map<string, any>([
			['a', NUM(1)],
			['b', ARR([NUM(1), NUM(2), NUM(3)])],
			['c', NUM(3)]
		])));
	});
});

describe('type declaration', () => {
	test.concurrent('def', async () => {
		const res = await exe(`
		let abc: num = 1
		var xyz: str = "abc"
		<: [abc xyz]
		`);
		eq(res, ARR([NUM(1), STR('abc')]));
	});

	test.concurrent('fn def', async () => {
		const res = await exe(`
		@f(x: arr<num>, y: str, z: @(num) => bool): arr<num> {
			x[3] = 0
			y = "abc"
			var r: bool = z(x[0])
			x[4] = if r 5 else 10
			x
		}

		<: f([1, 2, 3], "a", @(n) { n == 1 })
		`);
		eq(res, ARR([NUM(1), NUM(2), NUM(3), NUM(0), NUM(5)]));
	});
});

describe('meta', () => {
	test.concurrent('default meta', async () => {
		const res = getMeta(`
		### { a: 1; b: 2; c: 3; }
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
			### x [1 2 3]
			`);
			eq(res, new Map([
				['x', [1, 2, 3]]
			]));
		});

		test.concurrent('invalid', async () => {
			try {
				getMeta(`
				### x [1 (2 + 2) 3]
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
			### x { a: 1; b: 2; c: 3; }
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
				### x { a: 1; b: (2 + 2); c: 3; }
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

describe('Attribute', () => {
	test.concurrent('single attribute with function (str)', async () => {
		let node: Ast.Node;
		let attr: Ast.Attribute;
		const parser = new Parser();
		const nodes = parser.parse(`
		#[Event "Recieved"]
		@onRecieved(data) {
			data
		}
		`);
		assert.equal(nodes.length, 1);
		node = nodes[0];
		if (node.type !== 'def') assert.fail();
		assert.equal(node.name, 'onRecieved');
		assert.equal(node.attr.length, 1);
		// attribute 1
		attr = node.attr[0];
		if (attr.type !== 'attr') assert.fail();
		assert.equal(attr.name, 'Event');
		if (attr.value.type !== 'str') assert.fail();
		assert.equal(attr.value.value, 'Recieved');
	});

	test.concurrent('multiple attributes with function (obj, str, bool)', async () => {
		let node: Ast.Node;
		let attr: Ast.Attribute;
		const parser = new Parser();
		const nodes = parser.parse(`
		#[Endpoint { path: "/notes/create"; }]
		#[Desc "Create a note."]
		#[Cat true]
		@createNote(text) {
			<: text
		}
		`);
		assert.equal(nodes.length, 1);
		node = nodes[0];
		if (node.type !== 'def') assert.fail();
		assert.equal(node.name, 'createNote');
		assert.equal(node.attr.length, 3);
		// attribute 1
		attr = node.attr[0];
		if (attr.type !== 'attr') assert.fail();
		assert.equal(attr.name, 'Endpoint');
		if (attr.value.type !== 'obj') assert.fail();
		assert.equal(attr.value.value.size, 1);
		for (const [k, v] of attr.value.value) {
			if (k === 'path') {
				if (v.type !== 'str') assert.fail();
				assert.equal(v.value, '/notes/create');
			}
			else {
				assert.fail();
			}
		}
		// attribute 2
		attr = node.attr[1];
		if (attr.type !== 'attr') assert.fail();
		assert.equal(attr.name, 'Desc');
		if (attr.value.type !== 'str') assert.fail();
		assert.equal(attr.value.value, 'Create a note.');
		// attribute 3
		attr = node.attr[2];
		if (attr.type !== 'attr') assert.fail();
		assert.equal(attr.name, 'Cat');
		if (attr.value.type !== 'bool') assert.fail();
		assert.equal(attr.value.value, true);
	});

	// TODO: attributed function in block
	// TODO: attribute target does not exist

	test.concurrent('single attribute (no value)', async () => {
		let node: Ast.Node;
		let attr: Ast.Attribute;
		const parser = new Parser();
		const nodes = parser.parse(`
		#[serializable]
		let data = 1
		`);
		assert.equal(nodes.length, 1);
		node = nodes[0];
		if (node.type !== 'def') assert.fail();
		assert.equal(node.name, 'data');
		assert.equal(node.attr.length, 1);
		// attribute 1
		attr = node.attr[0];
		assert.ok(attr.type === 'attr');
		assert.equal(attr.name, 'serializable');
		if (attr.value.type !== 'bool') assert.fail();
		assert.equal(attr.value.value, true);
	});
});

describe('Location', () => {
	test.concurrent('function', async () => {
		let node: Ast.Node;
		const parser = new Parser();
		const nodes = parser.parse(`
		@f(a) { a }
		`);
		assert.equal(nodes.length, 1);
		node = nodes[0];
		if (!node.loc) assert.fail();
		assert.deepEqual(node.loc, { start: 3, end: 13 });
	});
});

describe('primitive props', () => {
	describe('num', () => {
		test.concurrent('to_str', async () => {
			const res = await exe(`
			let num = 123
			<: num.to_str()
			`);
			eq(res, STR('123'));
		});
	});

	describe('str', () => {
		test.concurrent('len', async () => {
			const res = await exe(`
			let str = "hello"
			<: str.len
			`);
			eq(res, NUM(5));
		});

		test.concurrent('to_num', async () => {
			const res = await exe(`
			let str = "123"
			<: str.to_num()
			`);
			eq(res, NUM(123));
		});

		test.concurrent('upper', async () => {
			const res = await exe(`
			let str = "hello"
			<: str.upper()
			`);
			eq(res, STR('HELLO'));
		});

		test.concurrent('lower', async () => {
			const res = await exe(`
			let str = "HELLO"
			<: str.lower()
			`);
			eq(res, STR('hello'));
		});

		test.concurrent('trim', async () => {
			const res = await exe(`
			let str = " hello  "
			<: str.trim()
			`);
			eq(res, STR('hello'));
		});

		test.concurrent('replace', async () => {
			const res = await exe(`
			let str = "hello"
			<: str.replace("l", "x")
			`);
			eq(res, STR('hexxo'));
		});

		test.concurrent('index_of', async () => {
			const res = await exe(`
			let str = "hello"
			<: str.index_of("l")
			`);
			eq(res, NUM(2));
		});

		test.concurrent('incl', async () => {
			const res = await exe(`
			let str = "hello"
			<: [str.incl("ll"), str.incl("x")]
			`);
			eq(res, ARR([TRUE, FALSE]));
		});

		test.concurrent('split', async () => {
			const res = await exe(`
			let str = "a,b,c"
			<: str.split(",")
			`);
			eq(res, ARR([STR('a'), STR('b'), STR('c')]));
		});

		test.concurrent('pick', async () => {
			const res = await exe(`
			let str = "hello"
			<: str.pick(1)
			`);
			eq(res, STR('e'));
		});

		test.concurrent('slice', async () => {
			const res = await exe(`
			let str = "hello"
			<: str.slice(1, 3)
			`);
			eq(res, STR('el'));
		});
	});

	describe('arr', () => {
		test.concurrent('len', async () => {
			const res = await exe(`
			let arr = [1, 2, 3]
			<: arr.len
			`);
			eq(res, NUM(3));
		});

		test.concurrent('push', async () => {
			const res = await exe(`
			let arr = [1, 2, 3]
			arr.push(4)
			<: arr
			`);
			eq(res, ARR([NUM(1), NUM(2), NUM(3), NUM(4)]));
		});

		test.concurrent('unshift', async () => {
			const res = await exe(`
			let arr = [1, 2, 3]
			arr.unshift(4)
			<: arr
			`);
			eq(res, ARR([NUM(4), NUM(1), NUM(2), NUM(3)]));
		});

		test.concurrent('pop', async () => {
			const res = await exe(`
			let arr = [1, 2, 3]
			let popped = arr.pop()
			<: [popped, arr]
			`);
			eq(res, ARR([NUM(3), ARR([NUM(1), NUM(2)])]));
		});

		test.concurrent('shift', async () => {
			const res = await exe(`
			let arr = [1, 2, 3]
			let shifted = arr.shift()
			<: [shifted, arr]
			`);
			eq(res, ARR([NUM(1), ARR([NUM(2), NUM(3)])]));
		});

		test.concurrent('concat', async () => {
			const res = await exe(`
			let arr = [1, 2, 3]
			let concated = arr.concat([4, 5])
			<: [concated, arr]
			`);
			eq(res, ARR([
				ARR([NUM(1), NUM(2), NUM(3), NUM(4), NUM(5)]),
				ARR([NUM(1), NUM(2), NUM(3)])
			]));
		});

		test.concurrent('slice', async () => {
			const res = await exe(`
			let arr = ["ant", "bison", "camel", "duck", "elephant"]
			let sliced = arr.slice(2, 4)
			<: [sliced, arr]
			`);
			eq(res, ARR([
				ARR([STR('camel'), STR('duck')]),
				ARR([STR('ant'), STR('bison'), STR('camel'), STR('duck'), STR('elephant')])
			]));
		});

		test.concurrent('join', async () => {
			const res = await exe(`
			let arr = ["a", "b", "c"]
			<: arr.join("-")
			`);
			eq(res, STR('a-b-c'));
		});

		test.concurrent('map', async () => {
			const res = await exe(`
			let arr = [1, 2, 3]
			<: arr.map(@(item) { item * 2 })
			`);
			eq(res, ARR([NUM(2), NUM(4), NUM(6)]));
		});

		test.concurrent('map with index', async () =>
		{
			const res = await exe(`
			let arr = [1, 2, 3]
			<: arr.map(@(item, index) { item * index })
			`);
			eq(res, ARR([NUM(0), NUM(2), NUM(6)]));
		});

		test.concurrent('filter', async () => {
			const res = await exe(`
			let arr = [1, 2, 3]
			<: arr.filter(@(item) { item != 2 })
			`);
			eq(res, ARR([NUM(1), NUM(3)]));
		});

		test.concurrent('filter with index', async () =>
		{
			const res = await exe(`
			let arr = [1, 2, 3, 4]
			<: arr.filter(@(item, index) { item != 2 && index != 3 })
			`);
			eq(res, ARR([NUM(1), NUM(3)]));
		});

		test.concurrent('reduce', async () => {
			const res = await exe(`
			let arr = [1, 2, 3, 4]
			<: arr.reduce(@(accumulator, currentValue) { (accumulator + currentValue) })
			`);
			eq(res, NUM(10));
		});

		test.concurrent('reduce with index', async () =>
		{
			const res = await exe(`
			let arr = [1, 2, 3, 4]
			<: arr.reduce(@(accumulator, currentValue, index) { (accumulator + (currentValue * index)) } 0)
			`);
			eq(res, NUM(20));
		});

		test.concurrent('find', async () => {
			const res = await exe(`
			let arr = ["abc", "def", "ghi"]
			<: arr.find(@(item) { item.incl("e") })
			`);
			eq(res, STR('def'));
		});

		test.concurrent('find with index', async () =>
		{
			const res = await exe(`
			let arr = ["abc1", "def1", "ghi1", "abc2", "def2", "ghi2"]
			<: arr.find(@(item, index) { item.incl("e") && index > 1 })
			`);
			eq(res, STR('def2'));
		});

		test.concurrent('incl', async () => {
			const res = await exe(`
			let arr = ["abc", "def", "ghi"]
			<: [arr.incl("def"), arr.incl("jkl")]
			`);
			eq(res, ARR([TRUE, FALSE]));
		});

		test.concurrent('reverse', async () => {
			const res = await exe(`
			let arr = [1, 2, 3]
			arr.reverse()
			<: arr
			`);
			eq(res, ARR([NUM(3), NUM(2), NUM(1)]));
		});

		test.concurrent('copy', async () => {
			const res = await exe(`
			let arr = [1, 2, 3]
			let copied = arr.copy()
			copied.reverse()
			<: [copied, arr]
			`);
			eq(res, ARR([
				ARR([NUM(3), NUM(2), NUM(1)]),
				ARR([NUM(1), NUM(2), NUM(3)])
			]));
		});
	test.concurrent('sort num array', async () => {
			const res = await exe(`
					var arr = [2, 10, 3]
					let comp = @(a, b) { a - b }
					arr.sort(comp)
					<: arr
				`);
			eq(res, ARR([NUM(2), NUM(3), NUM(10)]));
	});
	test.concurrent('sort string array (with Str:lt)', async () => {
			const res = await exe(`
					var arr = ["hoge", "huga", "piyo", "hoge"]
					arr.sort(Str:lt)
					<: arr
				`);
			eq(res, ARR([STR('hoge'), STR('hoge'), STR('huga'), STR('piyo')]));
	});
	test.concurrent('sort string array (with Str:gt)', async () => {
			const res = await exe(`
					var arr = ["hoge", "huga", "piyo", "hoge"]
					arr.sort(Str:gt)
					<: arr
				`);
		eq(res, ARR([ STR('piyo'),  STR('huga'), STR('hoge'), STR('hoge')]));
	});
	test.concurrent('sort object array', async () => {
			const res = await exe(`
					var arr = [{x: 2}, {x: 10}, {x: 3}]
					let comp = @(a, b) { a.x - b.x }

					arr.sort(comp)
					<: arr
				`);
			eq(res, ARR([OBJ(new Map([['x', NUM(2)]])), OBJ(new Map([['x', NUM(3)]])), OBJ(new Map([['x', NUM(10)]]))]));
	});
	});
});

describe('std', () => {
	describe('Core', () => {
		test.concurrent('range', async () => {
			eq(await exe('<: Core:range(1, 10)'), ARR([NUM(1), NUM(2), NUM(3), NUM(4), NUM(5), NUM(6), NUM(7), NUM(8), NUM(9), NUM(10)]));
			eq(await exe('<: Core:range(1, 1)'), ARR([NUM(1)]));
			eq(await exe('<: Core:range(9, 7)'), ARR([NUM(9), NUM(8), NUM(7)]));
		});

		test.concurrent('to_str', async () => {
			eq(await exe('<: Core:to_str("abc")'), STR('abc'));
			eq(await exe('<: Core:to_str(123)'), STR('123'));
			eq(await exe('<: Core:to_str(true)'), STR('true'));
			eq(await exe('<: Core:to_str(false)'), STR('false'));
			eq(await exe('<: Core:to_str(null)'), STR('null'));
			eq(await exe('<: Core:to_str({ a: "abc", b: 1234 })'), STR('{ a: "abc", b: 1234 }'));
			eq(await exe('<: Core:to_str([ true, 123, null ])'), STR('[ true, 123, null ]'));
			eq(await exe('<: Core:to_str(@( a, b, c ) {})'), STR('@( a, b, c ) { ... }'));
			eq(await exe(`
				let arr = []
				arr.push(arr)
				<: Core:to_str(arr)
			`), STR('[ ... ]'));
			eq(await exe(`
				let arr = []
				arr.push({ value: arr })
				<: Core:to_str(arr)
			`), STR('[ { value: ... } ]'));
		});
	});

	describe('Arr', () => {
	});
	
	describe('Math', () => {
		test.concurrent('trig', async () => {
			eq(await exe("<: Math:sin(Math:PI / 2)"), NUM(1));
			eq(await exe("<: Math:sin(0 - (Math:PI / 2))"), NUM(-1));
			eq(await exe("<: Math:sin(Math:PI / 4) * Math:cos(Math:PI / 4)"), NUM(0.5));
		});

		test.concurrent('abs', async () => {
			eq(await exe("<: Math:abs(1 - 6)"), NUM(5));
		});

		test.concurrent('pow and sqrt', async () => {
			eq(await exe("<: Math:sqrt(3^2 + 4^2)"), NUM(5));
		});

		test.concurrent('round', async () => {
			eq(await exe("<: Math:round(3.14)"), NUM(3));
			eq(await exe("<: Math:round(-1.414213)"), NUM(-1));
		});

		test.concurrent('ceil', async () => {
			eq(await exe("<: Math:ceil(2.71828)"), NUM(3));
			eq(await exe("<: Math:ceil(0 - Math:PI)"), NUM(-3));
			eq(await exe("<: Math:ceil(1 / Math:Infinity)"), NUM(0));
		});

		test.concurrent('floor', async () => {
			eq(await exe("<: Math:floor(23.14069)"), NUM(23));
			eq(await exe("<: Math:floor(Math:Infinity / 0)"), NUM(Infinity));
		});

		test.concurrent('min', async () => {
			eq(await exe("<: Math:min(2, 3)"), NUM(2));
		});

		test.concurrent('max', async () => {
			eq(await exe("<: Math:max(-2, -3)"), NUM(-2));
		});
		
		/* flaky
		test.concurrent('rnd', async () => {
			const steps = 512;

			const res = await exe(`
			let counts = [] // 0 ~ 10 の出現回数を格納する配列
			for (11) {
				counts.push(0) // 初期化
			}

			for (${steps}) {
				let rnd = Math:rnd(0 10) // 0 以上 10 以下の整数乱数
				counts[rnd] = counts[rnd] + 1
			}
			<: counts`);

			function chiSquareTest(observed: number[], expected: number[]) {
				let chiSquare = 0; // カイ二乗値
				for (let i = 0; i < observed.length; i++) {
					chiSquare += Math.pow(observed[i] - expected[i], 2) / expected[i];
				}
				return chiSquare;
			}

			let observed: Array<number> = [];
			for (let i = 0; i < res.value.length; i++) {
				observed.push(res.value[i].value);
			}
			let expected = new Array(11).fill(steps / 10);
			let chiSquare = chiSquareTest(observed, expected);

			// 自由度が (11 - 1) の母分散の カイ二乗分布 95% 信頼区間は [3.94, 18.31]
			assert.deepEqual(3.94 <= chiSquare && chiSquare <= 18.31, true, `カイ二乗値(${chiSquare})が母分散の95%信頼区間にありません`);
		});
		*/

		test.concurrent('rnd with arg', async () => {
			eq(await exe("<: Math:rnd(1, 1.5)"), NUM(1));
		});

		test.concurrent('gen_rng', async () => {
			const res = await exe(`
			@test(seed) {
				let random = Math:gen_rng(seed)
				return random(0 100)
			}
			let seed1 = \`{Util:uuid()}\`
			let seed2 = \`{Date:year()}\`
			let test1 = if (test(seed1) == test(seed1)) {true} else {false}
			let test2 = if (test(seed1) == test(seed2)) {true} else {false}
			<: [test1 test2]
			`)
			eq(res, ARR([BOOL(true), BOOL(false)]));
		});
	});

	describe('Obj', () => {
		test.concurrent('keys', async () => {
			const res = await exe(`
			let o = { a: 1; b: 2; c: 3; }

			<: Obj:keys(o)
			`);
			eq(res, ARR([STR('a'), STR('b'), STR('c')]));
		});

		test.concurrent('vals', async () => {
			const res = await exe(`
			let o = { _nul: null; _num: 24; _str: 'hoge'; _arr: []; _obj: {}; }

			<: Obj:vals(o)
			`);
			eq(res, ARR([NULL, NUM(24), STR('hoge'), ARR([]), OBJ(new Map([]))]));
		});

		test.concurrent('kvs', async () => {
			const res = await exe(`
			let o = { a: 1; b: 2; c: 3; }

			<: Obj:kvs(o)
			`);
			eq(res, ARR([
				ARR([STR('a'), NUM(1)]),
				ARR([STR('b'), NUM(2)]),
				ARR([STR('c'), NUM(3)])
			]));
		});
	});

	describe('Str', () => {
		test.concurrent('lf', async () => {
			const res = await exe(`
			<: Str:lf
			`);
			eq(res, STR('\n'));
		});
	});

	describe('Json', () => {
		test.concurrent('stringify: fn', async () => {
			const res = await exe(`
			<: Json:stringify(@(){})
			`);
			eq(res, STR('"<function>"'));
		});

		test.concurrent('parsable', async () => {
			[
				'',
				'null',
				'hoge',
				'"hoge"',
				'[',
				'[]',
				'{}'
			].forEach(async (str) => {
				const res = await exe(`
					<: Json:parsable('${str}')
				`);
				assert.deepEqual(res.type, 'bool');
				if (res.value) {
					await exe(`
						<: Json:parse('${str}')
					`);
				} else {
					try {
						await exe(`
							<: Json:parse('${str}')
						`);
					} catch (e) {
						if (e instanceof SyntaxError) return;
					}
					assert.fail()
				}
			});
		});
	});
});

describe('Unicode', () => {
	test.concurrent('len', async () => {
		const res = await exe(`
		<: "👍🏽🍆🌮".len
		`);
		eq(res, NUM(3));
	});

	test.concurrent('pick', async () => {
		const res = await exe(`
		<: "👍🏽🍆🌮".pick(1)
		`);
		eq(res, STR('🍆'));
	});

	test.concurrent('slice', async () => {
		const res = await exe(`
		<: "Emojis 👍🏽 are 🍆 poison. 🌮s are bad.".slice(7, 14)
		`);
		eq(res, STR('👍🏽 are 🍆'));
	});

	test.concurrent('split', async () => {
		const res = await exe(`
		<: "👍🏽🍆🌮".split()
		`);
		eq(res, ARR([STR('👍🏽'), STR('🍆'), STR('🌮')]));
	});
});

describe('Security', () => {
	test.concurrent('Cannot access js native property via var', async () => {
		try {
			await exe(`
			<: constructor
			`);
			assert.fail();
		} catch (e) {
			assert.equal(e instanceof errors.RuntimeError, true);
		}

		try {
			await exe(`
			<: prototype
			`);
			assert.fail();
		} catch (e) {
			assert.equal(e instanceof errors.RuntimeError, true);
		}

		try {
			await exe(`
			<: __proto__
			`);
			assert.fail();
		} catch (e) {
			assert.equal(e instanceof errors.RuntimeError, true);
		}
	});

	test.concurrent('Cannot access js native property via object', async () => {
		const res1 = await exe(`
		let obj = {}

		<: obj.constructor
		`);
		eq(res1, NULL);

		const res2 = await exe(`
		let obj = {}

		<: obj.prototype
		`);
		eq(res2, NULL);

		const res3 = await exe(`
		let obj = {}

		<: obj.__proto__
		`);
		eq(res3, NULL);
	});

	test.concurrent('Cannot access js native property via primitive prop', async () => {
		try {
			await exe(`
			<: "".constructor
			`);
			assert.fail();
		} catch (e) {
			assert.equal(e instanceof errors.RuntimeError, true);
		}

		try {
			await exe(`
			<: "".prototype
			`);
			assert.fail();
		} catch (e) {
			assert.equal(e instanceof errors.RuntimeError, true);
		}

		try {
			await exe(`
			<: "".__proto__
			`);
			assert.fail();
		} catch (e) {
			assert.equal(e instanceof errors.RuntimeError, true);
		}
	});
});

describe('extra', () => {
	test.concurrent('Fizz Buzz', async () => {
		const res = await exe(`
		let res = []
		for (let i = 1, 15) {
			let msg =
				if (i % 15 == 0) "FizzBuzz"
				elif (i % 3 == 0) "Fizz"
				elif (i % 5 == 0) "Buzz"
				else i
			res.push(msg)
		}
		<: res
		`);
		eq(res, ARR([
			NUM(1),
			NUM(2),
			STR('Fizz'),
			NUM(4),
			STR('Buzz'),
			STR('Fizz'),
			NUM(7),
			NUM(8),
			STR('Fizz'),
			STR('Buzz'),
			NUM(11),
			STR('Fizz'),
			NUM(13),
			NUM(14),
			STR('FizzBuzz'),
		]));
	});

	test.concurrent('SKI', async () => {
		const res = await exe(`
		let s = @(x) { @(y) { @(z) {
			//let f = x(z) f(@(a){ let g = y(z) g(a) })
			let f = x(z)
			f(y(z))
		}}}
		let k = @(x){ @(y) { x } }
		let i = @(x){ x }

		// combine
		@c(l) {
			// extract
			@x(v) {
				if (Core:type(v) == "arr") { c(v) } else { v }
			}

			// rec
			@r(f, n) {
				if (n < l.len) {
					r(f(x(l[n])), (n + 1))
				} else { f }
			}

			r(x(l[0]), 1)
		}

		let sksik = [s, [k, [s, i]], k]
		c([sksik, "foo", print])
		`);
		eq(res, STR('foo'));
	});
});
