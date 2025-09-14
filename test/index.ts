/* eslint-disable prefer-const */
/**
 * Tests!
 */

import * as assert from 'assert';
import { describe, test } from 'vitest';
import { Parser, Interpreter, Ast } from '../src';
import { NUM, STR, NULL, ARR, OBJ, BOOL, TRUE, FALSE, ERROR ,FN_NATIVE } from '../src/interpreter/value';
import { AiScriptSyntaxError, AiScriptRuntimeError, AiScriptIndexOutOfRangeError } from '../src/error';
import { exe, eq } from './testutils';


test.concurrent('Hello, world!', async () => {
	const res = await exe('<: "Hello, world!"');
	eq(res, STR('Hello, world!'));
});

test.concurrent('empty script', async () => {
	const parser = new Parser();
	const ast = parser.parse('');
	assert.deepEqual(ast, []);
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

test.concurrent('参照が繋がらない', async () => {
	const res = await exe(`
	var f = @() { "a" }
	var g = f
	f = @() { "b" }

	<: g()
	`);
	eq(res, STR('a'));
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
			get_count: @() { count },
			count: @() { count = (count + 1) },
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

describe('Object', () => {
	test.concurrent('property access', async () => {
		const res = await exe(`
		let obj = {
			a: {
				b: {
					c: 42,
				},
			},
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
					c: f,
				},
			},
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
	 * see also: test/literals.ts > literal > obj (string key)
	 * issue: https://github.com/aiscript-dev/aiscript/issues/62
	test.concurrent('string key', async () => {
		const res = await exe(`
		let obj = {
			"藍": 42,
		}

		<: obj."藍"
		`);
		eq(res, NUM(42));
	});

	test.concurrent('string key including colon and period', async () => {
		const res = await exe(`
		let obj = {
			":.:": 42,
		}

		<: obj.":.:"
		`);
		eq(res, NUM(42));
	});

	test.concurrent('expression key', async () => {
		const res = await exe(`
		let key = "藍"

		let obj = {
			<key>: 42,
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
		assert.rejects(exe(`
			let arr = [1, 2, 3]

			arr[3] = 4

			<: null
		`), AiScriptIndexOutOfRangeError);

		assert.rejects(exe(`
			let arr = [1, 2, 3]

			arr[9] = 10

			<: null
		`), AiScriptIndexOutOfRangeError)
	});

	test.concurrent('index out of range error', async () => {
		try {
			await exe(`
			<: [42][1]
			`);
		} catch (e) {
			assert.equal(e instanceof AiScriptIndexOutOfRangeError, true);
			return;
		}
		assert.fail();
	});

	test.concurrent('index out of range on assignment', async () => {
		try {
			await exe(`
			var a = []
	 		a[2] = 'hoge'
			`);
		} catch (e) {
			assert.equal(e instanceof AiScriptIndexOutOfRangeError, true);
			return;
		}
		assert.fail();
	});

	test.concurrent('non-integer-indexed assignment', async () => {
		try {
			await exe(`
			var a = []
	 		a[6.21] = 'hoge'
			`);
		} catch (e) {
			assert.equal(e instanceof AiScriptIndexOutOfRangeError, true);
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
				b: [@(name) { name }, @(str) { "chan" }, @() { "kawaii" }],
			},
		}

		<: obj.a.b[0]("ai")
		`);
		eq(res, STR('ai'));
	});

	test.concurrent('chained assign left side (prop + index)', async () => {
		const res = await exe(`
		let obj = {
			a: {
				b: ["ai", "chan", "kawaii"],
			},
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
				b: ["ai", "chan", "kawaii"],
			},
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
				a: 1,
				b: 2,
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
				b: [1, 2, 3],
			},
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

	test.concurrent('object with index', async () => {
		const res = await exe(`
		let ai = {a: {}}['a']
		ai['chan'] = 'kawaii'
		<: ai[{a: 'chan'}['a']]
		`);
		eq(res, STR('kawaii'));
	});

	test.concurrent('property chain with parenthesis', async () => {
		let ast = Parser.parse(`
				(a.b).c
			`);
		const line = ast[0];
		if (
			line.type !== 'prop' ||
			line.target.type !== 'prop' ||
			line.target.target.type !== 'identifier'
		)
			assert.fail();
		assert.equal(line.target.target.name, 'a');
		assert.equal(line.target.name, 'b');
		assert.equal(line.name, 'c');
	});

	test.concurrent('index chain with parenthesis', async () => {
		let ast = Parser.parse(`
				(a[42]).b
			`);
		const line = ast[0];
		if (
			line.type !== 'prop' ||
			line.target.type !== 'index' ||
			line.target.target.type !== 'identifier' ||
			line.target.index.type !== 'num'
		)
			assert.fail();
		assert.equal(line.target.target.name, 'a');
		assert.equal(line.target.index.value, 42);
		assert.equal(line.name, 'b');
	});

	test.concurrent('call chain with parenthesis', async () => {
		let ast = Parser.parse(`
				(foo(42, 57)).bar
			`);
		const line = ast[0];
		if (
			line.type !== 'prop' ||
			line.target.type !== 'call' ||
			line.target.target.type !== 'identifier' ||
			line.target.args.length !== 2 ||
			line.target.args[0].type !== 'num' ||
			line.target.args[1].type !== 'num'
		)
			assert.fail();
		assert.equal(line.target.target.name, 'foo');
		assert.equal(line.target.args[0].value, 42);
		assert.equal(line.target.args[1].value, 57);
		assert.equal(line.name, 'bar');
	});

	test.concurrent('longer chain with parenthesis', async () => {
		let ast = Parser.parse(`
				(a.b.c).d.e
			`);
		const line = ast[0];
		if (
			line.type !== 'prop' ||
			line.target.type !== 'prop' ||
			line.target.target.type !== 'prop' ||
			line.target.target.target.type !== 'prop' ||
			line.target.target.target.target.type !== 'identifier'
		)
			assert.fail();
		assert.equal(line.target.target.target.target.name, 'a');
		assert.equal(line.target.target.target.name, 'b');
		assert.equal(line.target.target.name, 'c');
		assert.equal(line.target.name, 'd');
		assert.equal(line.name, 'e');
	});
});

test.concurrent('Does not throw error when divided by zero', async () => {
	const res = await exe(`
		<: (0 / 0)
	`);
	eq(res, NUM(NaN));
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

	test.concurrent('optional args', async () => {
		const res = await exe(`
		@f(x, y?, z?) {
			[x, y, z]
		}
		<: f(true)
		`);
		eq(res, ARR([TRUE, NULL, NULL]));
	});

	test.concurrent('args with default value', async () => {
		const res = await exe(`
		@f(x, y=1, z=2) {
			[x, y, z]
		}
		<: f(5, 3)
		`);
		eq(res, ARR([NUM(5), NUM(3), NUM(2)]));
	});

	test.concurrent('args must not be both optional and default-valued', async () => {
		try {
			Parser.parse(`
			@func(a? = 1){}
			`);
		} catch (e) {
			assert.ok(e instanceof AiScriptSyntaxError);
			return;
		}
		assert.fail();
	});

	test.concurrent('missing arg', async () => {
		try {
			await exe(`
			@func(a){}
			func()
			`);
		} catch (e) {
			assert.ok(e instanceof AiScriptRuntimeError);
			return;
		}
		assert.fail();
	});

	test.concurrent('std: throw AiScript error when required arg missing', async () => {
		try {
			await exe(`
			<: Core:eq(1)
			`);
		} catch (e) {
			assert.ok(e instanceof AiScriptRuntimeError);
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

describe('type declaration', () => {
	test.concurrent('def', async () => {
		const res = await exe(`
		let abc: num = 1
		var xyz: str = "abc"
		<: [abc, xyz]
		`);
		eq(res, ARR([NUM(1), STR('abc')]));
	});

	test.concurrent('fn def', async () => {
		const res = await exe(`
		@f(x: arr<num>, y: str, z: @(num) => bool): arr<num> {
			x.push(0)
			y = "abc"
			var r: bool = z(x[0])
			x.push(if r 5 else 10)
			x
		}

		<: f([1, 2, 3], "a", @(n) { n == 1 })
		`);
		eq(res, ARR([NUM(1), NUM(2), NUM(3), NUM(0), NUM(5)]));
	});

	test.concurrent('def (null)', async () => {
		const res = await exe(`
		let a: null = null
		<: a
		`);
		eq(res, NULL);
	});

	test.concurrent('fn def (null)', async () => {
		const res = await exe(`
		@f(): null {}
		<: f()
		`);
		eq(res, NULL);
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
		if (node.type !== 'def' || node.dest.type !== 'identifier') assert.fail();
		assert.equal(node.dest.name, 'onRecieved');
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
		#[Endpoint { path: "/notes/create" }]
		#[Desc "Create a note."]
		#[Cat true]
		@createNote(text) {
			<: text
		}
		`);
		assert.equal(nodes.length, 1);
		node = nodes[0];
		if (node.type !== 'def' || node.dest.type !== 'identifier') assert.fail();
		assert.equal(node.dest.name, 'createNote');
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
		if (node.type !== 'def' || node.dest.type !== 'identifier') assert.fail();
		assert.equal(node.dest.name, 'data');
		assert.equal(node.attr.length, 1);
		// attribute 1
		attr = node.attr[0];
		assert.ok(attr.type === 'attr');
		assert.equal(attr.name, 'serializable');
		if (attr.value.type !== 'bool') assert.fail();
		assert.equal(attr.value.value, true);
	});

	test.concurrent('attribute with statement under namespace', async () => {
		const parser = new Parser();
		const nodes = parser.parse(`
		:: Tests {
			#[test]
			@assert_success() {
				<: "Hello, world!"
			}
		}
		`);
		assert.equal(nodes.length, 1);
		const ns = nodes[0];
		assert.ok(ns.type === 'ns');
		const member = ns.members[0];
		assert.ok(member.type === 'def');
		const attr = member.attr[0];
		assert.equal(attr.name, 'test');
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
		assert.deepEqual(node.loc, {
			start: { line: 2, column: 4 },
			end: { line: 2, column: 15 },
		});
	});
	test.concurrent('comment', async () => {
		let node: Ast.Node;
		const parser = new Parser();
		const nodes = parser.parse(`
		/*
		*/
		// hoge
		@f(a) { a }
		`);
		assert.equal(nodes.length, 1);
		node = nodes[0];
		if (!node.loc) assert.fail();
		assert.deepEqual(node.loc.start, { line: 5, column: 3 });
	});
	test.concurrent('template', async () => {
		let node: Ast.Node;
		const parser = new Parser();
		const nodes = parser.parse(`
			\`hoge{1}fuga\`
		`);
		assert.equal(nodes.length, 1);
		node = nodes[0];
		if (!node.loc || node.type !== "tmpl") assert.fail();
		assert.deepEqual(node.loc, {
			start: { line: 2, column: 4 },
			end: { line: 2, column: 17 },
		});
		assert.equal(node.tmpl.length, 3);
		const [elem1, elem2, elem3] = node.tmpl as Ast.Expression[];
		assert.deepEqual(elem1.loc, {
			start: { line: 2, column: 4 },
			end: { line: 2, column: 10 },
		});
		assert.deepEqual(elem2.loc, {
			start: { line: 2, column: 10 },
			end: { line: 2, column: 11 },
		});
		assert.deepEqual(elem3.loc, {
			start: { line: 2, column: 11 },
			end: { line: 2, column: 17 },
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
			assert.ok(e instanceof AiScriptSyntaxError);
		}

		try {
			await exe(`
			<: prototype
			`);
			assert.fail();
		} catch (e) {
			assert.ok(e instanceof AiScriptRuntimeError);
		}

		try {
			await exe(`
			<: __proto__
			`);
			assert.fail();
		} catch (e) {
			assert.ok(e instanceof AiScriptRuntimeError);
		}
	});

	test.concurrent('Cannot access js native property via object', async () => {
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
			assert.ok(e instanceof AiScriptSyntaxError);
		}

		try {
			await exe(`
			<: "".prototype
			`);
			assert.fail();
		} catch (e) {
			assert.ok(e instanceof AiScriptRuntimeError);
		}

		try {
			await exe(`
			<: "".__proto__
			`);
			assert.fail();
		} catch (e) {
			assert.equal(e instanceof AiScriptRuntimeError, true);
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
