/**
 * Tests!
 */

import * as assert from 'assert';
import { parse, analyze, serialize, deserialize } from '../src';
import { AiScript } from '../src/interpreter';
import { NUM, STR, NULL, ARR, OBJ, BOOL } from '../src/interpreter/value';
import { NAttr, Node } from '../src/node';

const exe = (program: string): Promise<any> => new Promise((ok, err) => {
	const aiscript = new AiScript({}, {
		out(value) {
			ok(value);
		},
	});

	const ast = analyze(parse(program));

	const _ast = deserialize(serialize(ast));

	aiscript.exec(_ast).catch(err);
});

const getMeta = (program: string) => {
	const ast = analyze(parse(program));

	const metadata = AiScript.collectMetadata(ast);

	return metadata;
};

const eq = (a, b) => {
	assert.deepEqual(a.type, b.type);
	assert.deepEqual(a.value, b.value);
};

it('Hello, world!', async () => {
	const res = await exe('<: "Hello, world!"');
	eq(res, STR('Hello, world!'));
});

describe('ops', () => {
	it('=', async () => {
		eq(await exe('<: (1 = 1)'), BOOL(true));
		eq(await exe('<: (1 = 2)'), BOOL(false));
	});

	it('!=', async () => {
		eq(await exe('<: (1 != 2)'), BOOL(true));
		eq(await exe('<: (1 != 1)'), BOOL(false));
	});

	it('&', async () => {
		eq(await exe('<: (yes & yes)'), BOOL(true));
		eq(await exe('<: (yes & no)'), BOOL(false));
		eq(await exe('<: (no & yes)'), BOOL(false));
		eq(await exe('<: (no & no)'), BOOL(false));
	});

	it('|', async () => {
		eq(await exe('<: (yes | yes)'), BOOL(true));
		eq(await exe('<: (yes | no)'), BOOL(true));
		eq(await exe('<: (no | yes)'), BOOL(true));
		eq(await exe('<: (no | no)'), BOOL(false));
	});

	it('+', async () => {
		eq(await exe('<: (1 + 1)'), NUM(2));
	});

	it('-', async () => {
		eq(await exe('<: (1 - 1)'), NUM(0));
	});

	it('*', async () => {
		eq(await exe('<: (1 * 1)'), NUM(1));
	});

	it('/', async () => {
		eq(await exe('<: (1 / 1)'), NUM(1));
	});

	it('%', async () => {
		eq(await exe('<: (1 % 1)'), NUM(0));
	});

	it('>', async () => {
		eq(await exe('<: (2 > 1)'), BOOL(true));
		eq(await exe('<: (1 > 1)'), BOOL(false));
		eq(await exe('<: (0 > 1)'), BOOL(false));
	});

	it('<', async () => {
		eq(await exe('<: (2 < 1)'), BOOL(false));
		eq(await exe('<: (1 < 1)'), BOOL(false));
		eq(await exe('<: (0 < 1)'), BOOL(true));
	});

	it('>=', async () => {
		eq(await exe('<: (2 >= 1)'), BOOL(true));
		eq(await exe('<: (1 >= 1)'), BOOL(true));
		eq(await exe('<: (0 >= 1)'), BOOL(false));
	});

	it('<=', async () => {
		eq(await exe('<: (2 <= 1)'), BOOL(false));
		eq(await exe('<: (1 <= 1)'), BOOL(true));
		eq(await exe('<: (0 <= 1)'), BOOL(true));
	});
});

describe('Infix expression', () => {
	it('simple infix expression', async () => {
		eq(await exe('<: 0 < 1'), BOOL(true));
		eq(await exe('<: 1 + 1'), NUM(2));
	});

	it('combination', async () => {
		eq(await exe('<: 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10'), NUM(55));
	});

	it('use parentheses to distinguish expr', async () => {
		eq(await exe('<: (1 + 10) * (2 + 5)'), NUM(77));
	});
});

it('Escaped double quote', async () => {
	const res = await exe('<: "ai saw a note \\"bebeyo\\"."');
	eq(res, STR('ai saw a note "bebeyo".'));
});

it('//', async () => {
	const res = await exe('<: "//"');
	eq(res, STR('//'));
});

it('式にコロンがあってもオブジェクトと判定されない', async () => {
	const res = await exe(`
	<: {
		Str:incl("ai", "a")
	}
	`);
	eq(res, BOOL(true));
});

it('inc', async () => {
	const res = await exe(`
	$a <- 0
	a +<- 1
	a +<- 2
	a +<- 3
	<: a
	`);
	eq(res, NUM(6));
});

it('dec', async () => {
	const res = await exe(`
	$a <- 0
	a -<- 1
	a -<- 2
	a -<- 3
	<: a
	`);
	eq(res, NUM(-6));
});

it('var', async () => {
	const res = await exe(`
	#a = 42
	<: a
	`);
	eq(res, NUM(42));
});

it('Closure', async () => {
	const res = await exe(`
	@store(v) {
		#state = v
		@() {
			state
		}
	}
	#s = store("ai")
	<: s()
	`);
	eq(res, STR('ai'));
});

it('Closure (counter)', async () => {
	const res = await exe(`
	@create_counter() {
		$count <- 0
		{
			get_count: @() { count };
			count: @() { count <- (count + 1) };
		}
	}

	#counter = create_counter()
	#get_count = counter.get_count
	#count = counter.count

	count()
	count()
	count()

	<: get_count()
	`);
	eq(res, NUM(3));
});

it('Recursion', async () => {
	const res = await exe(`
	@fact(n) {
		if (n = 0) { 1 } else { (fact((n - 1)) * n) }
	}

	<: fact(5)
	`);
	eq(res, NUM(120));
});

it('Var name starts with \'no\'', async () => {
	const res = await exe(`
	#note = "ai"

	<: note
	`);
	eq(res, STR('ai'));
});

describe('Object', () => {
	it('property access', async () => {
		const res = await exe(`
		#obj = {
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

	it('property access (fn call)', async () => {
		const res = await exe(`
		@fn() { 42 }

		#obj = {
			a: {
				b: {
					c: fn;
				};
			};
		}

		<: obj.a.b.c()
		`);
		eq(res, NUM(42));
	});

	it('property assign', async () => {
		const res = await exe(`
		#obj = {
			a: 1
			b: {
				c: 2
				d: {
					e: 3
				}
			}
		}

		obj.a <- 24
		obj.b.d.e <- 42

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
	it('string key', async () => {
		const res = await exe(`
		#obj = {
			"藍": 42;
		}

		<: obj."藍"
		`);
		eq(res, NUM(42));
	});

	it('string key including colon and period', async () => {
		const res = await exe(`
		#obj = {
			":.:": 42;
		}

		<: obj.":.:"
		`);
		eq(res, NUM(42));
	});

	it('expression key', async () => {
		const res = await exe(`
		#key = "藍"

		#obj = {
			<key>: 42;
		}

		<: obj<key>
		`);
		eq(res, NUM(42));
	});
	*/
});

it('Array item access', async () => {
	const res = await exe(`
	#arr = ["ai", "chan", "kawaii"]

	<: arr[2]
	`);
	eq(res, STR('chan'));
});

it('Array item assign', async () => {
	const res = await exe(`
	#arr = ["ai", "chan", "kawaii"]

	arr[2] <- "taso"

	<: arr
	`);
	eq(res, ARR([STR('ai'), STR('taso'), STR('kawaii')]));
});

describe('Template syntax', () => {
	it('Basic', async () => {
		const res = await exe(`
		#attr = "kawaii"
		<: \`Ai is {attr}!\`
		`);
		eq(res, STR('Ai is kawaii!'));
	});

	it('convert to str', async () => {
		const res = await exe(`
		<: \`1 + 1 = {(1 + 1)}\`
		`);
		eq(res, STR('1 + 1 = 2'));
	});

	it('Escape', async () => {
		const res = await exe(`
		#message = "Hello"
		<: \`\\\`a\\{b\\}c\\\`\`
		`);
		eq(res, STR('`a{b}c`'));
	});
});

it('Cannot access js native property via var', async () => {
	try {
		await exe(`
		<: constructor
		`);
	} catch(e) {
		assert.ok(true);
		return;
	}
	assert.fail();
});

it('Cannot access js native property via object', async () => {
	const res = await exe(`
	#obj = {}

	<: obj.constructor
	`);
	eq(res, NULL);
});

it('Throws error when divied by zero', async () => {
	try {
		await exe(`
		<: (0 / 0)
		`);
	} catch(e) {
		assert.ok(true);
		return;
	}
	assert.fail();
});

it('Fizz Buzz', async () => {
	const res = await exe(`
	#res = []
	for (#i, 15) {
		#msg =
			if ((i % 15) = 0) "FizzBuzz"
			elif ((i % 3) = 0) "Fizz"
			elif ((i % 5) = 0) "Buzz"
			else i
		Arr:push(res msg)
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

it('SKI', async () => {
	const res = await exe(`
	#s = @(x) { @(y) { @(z) {
		//#f = x(z) f(@(a){ #g = y(z) g(a) })
		#f = x(z)
		f(y(z))
	}}}
	#k = @(x){ @(y) { x } }
	#i = @(x){ x }

	// combine
	@c(l) {
		#L = (Arr:len(l) + 1)

		// extract
		@x(v) {
			if (Core:type(v) = "arr") { c(v) } else { v }
		}

		// rec
		@r(f, n) {
			if (n < L) {
				r(f(x(l[n])), (n + 1))
			} else { f }
		}

		r(x(l[1]), 2)
	}

	#sksik = [s, [k, [s, i]], k]
	c([sksik, "foo", print])
	`);
	eq(res, STR('foo'));
});

describe('Function call', () => {
	it('without args', async () => {
		const res = await exe(`
		@f() {
			42
		}
		<: f()
		`);
		eq(res, NUM(42));
	});

	it('with args', async () => {
		const res = await exe(`
		@f(x) {
			x
		}
		<: f(42)
		`);
		eq(res, NUM(42));
	});

	it('with args (separated by comma)', async () => {
		const res = await exe(`
		@f(x, y) {
			(x + y)
		}
		<: f(1, 1)
		`);
		eq(res, NUM(2));
	});

	it('with args (separated by space)', async () => {
		const res = await exe(`
		@f(x y) {
			(x + y)
		}
		<: f(1 1)
		`);
		eq(res, NUM(2));
	});
});

describe('Return', () => {
	it('Early return', async () => {
		const res = await exe(`
		@f() {
			if yes {
				<< "ai"
			}

			"pope"
		}
		<: f()
		`);
		eq(res, STR('ai'));
	});

	it('Early return (nested)', async () => {
		const res = await exe(`
		@f() {
			if yes {
				if yes {
					<< "ai"
				}
			}

			"pope"
		}
		<: f()
		`);
		eq(res, STR('ai'));
	});

	it('Early return (nested) 2', async () => {
		const res = await exe(`
		@f() {
			if yes {
				<< "ai"
			}

			"pope"
		}

		@g() {
			if (f() = "ai") {
				<< "kawaii"
			}

			"pope"
		}

		<: g()
		`);
		eq(res, STR('kawaii'));
	});

	it('Early return without block', async () => {
		const res = await exe(`
		@f() {
			if yes << "ai"

			"pope"
		}
		<: f()
		`);
		eq(res, STR('ai'));
	});
});

describe('Block', () => {
	it('returns value', async () => {
		const res = await exe(`
		#foo = {
			#a = 1
			#b = 2
			(a + b)
		}

		<: foo
		`);
		eq(res, NUM(3));
	});
});

describe('if', () => {
	it('if', async () => {
		const res1 = await exe(`
		$msg <- "ai"
		if yes {
			msg <- "kawaii"
		}
		<: msg
		`);
		eq(res1, STR('kawaii'));

		const res2 = await exe(`
		$msg <- "ai"
		if no {
			msg <- "kawaii"
		}
		<: msg
		`);
		eq(res2, STR('ai'));
	});

	it('else', async () => {
		const res1 = await exe(`
		$msg <- _
		if yes {
			msg <- "ai"
		} else {
			msg <- "kawaii"
		}
		<: msg
		`);
		eq(res1, STR('ai'));

		const res2 = await exe(`
		$msg <- _
		if no {
			msg <- "ai"
		} else {
			msg <- "kawaii"
		}
		<: msg
		`);
		eq(res2, STR('kawaii'));
	});

	it('elif', async () => {
		const res1 = await exe(`
		$msg <- "bebeyo"
		if no {
			msg <- "ai"
		} elif yes {
			msg <- "kawaii"
		}
		<: msg
		`);
		eq(res1, STR('kawaii'));

		const res2 = await exe(`
		$msg <- "bebeyo"
		if no {
			msg <- "ai"
		} elif no {
			msg <- "kawaii"
		}
		<: msg
		`);
		eq(res2, STR('bebeyo'));
	});

	it('if ~ elif ~ else', async () => {
		const res1 = await exe(`
		$msg <- _
		if no {
			msg <- "ai"
		} elif yes {
			msg <- "chan"
		} else {
			msg <- "kawaii"
		}
		<: msg
		`);
		eq(res1, STR('chan'));

		const res2 = await exe(`
		$msg <- _
		if no {
			msg <- "ai"
		} elif no {
			msg <- "chan"
		} else {
			msg <- "kawaii"
		}
		<: msg
		`);
		eq(res2, STR('kawaii'));
	});

	it('expr', async () => {
		const res1 = await exe(`
		<: if yes "ai" else "kawaii"
		`);
		eq(res1, STR('ai'));

		const res2 = await exe(`
		<: if no "ai" else "kawaii"
		`);
		eq(res2, STR('kawaii'));
	});
});

describe('match', () => {
	it('Basic', async () => {
		const res = await exe(`
		<: match 2 {
			1 => "a"
			2 => "b"
			3 => "c"
		}
		`);
		eq(res, STR('b'));
	});

	it('When default not provided, returns null', async () => {
		const res = await exe(`
		<: match 42 {
			1 => "a"
			2 => "b"
			3 => "c"
		}
		`);
		eq(res, NULL);
	});

	it('With default', async () => {
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

	it('With block', async () => {
		const res = await exe(`
		<: match 2 {
			1 => 1
			2 => {
				#a = 1
				#b = 2
				(a + b)
			}
			3 => 3
		}
		`);
		eq(res, NUM(3));
	});

	it('With return', async () => {
		const res = await exe(`
		@f(x) {
			match x {
				1 => {
					<< "ai"
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
	it('Basic', async () => {
		const res = await exe(`
		$count <- 0
		loop {
			if (count = 10) break
			count <- (count + 1)
		}
		<: count
		`);
		eq(res, NUM(10));
	});

	it('with continue', async () => {
		const res = await exe(`
		$a <- ["ai" "chan" "kawaii" "!"]
		$b <- []
		loop {
			$x <- Arr:shift(a)
			if (x = "chan") continue
			if (x = "!") break
			Arr:push(b, x)
		}
		<: b
		`);
		eq(res, ARR([STR('ai'), STR('kawaii')]));
	});
});

describe('for', () => {
	it('Basic', async () => {
		const res = await exe(`
		$count <- 0
		for (#i, 10) {
			count <- (count + i)
		}
		<: count
		`);
		eq(res, NUM(55));
	});

	it('wuthout iterator', async () => {
		const res = await exe(`
		$count <- 0
		for (10) {
			count <- (count + 1)
		}
		<: count
		`);
		eq(res, NUM(10));
	});

	it('without brackets', async () => {
		const res = await exe(`
		$count <- 0
		for #i, 10 {
			count <- (count + i)
		}
		<: count
		`);
		eq(res, NUM(55));
	});

	it('Break', async () => {
		const res = await exe(`
		$count <- 0
		for (#i, 20) {
			if (i = 11) break
			count <- (count + i)
		}
		<: count
		`);
		eq(res, NUM(55));
	});

	it('continue', async () => {
		const res = await exe(`
		$count <- 0
		for (#i, 10) {
			if (i = 5) continue
			count <- (count + 1)
		}
		<: count
		`);
		eq(res, NUM(9));
	});

	it('single statement', async () => {
		const res = await exe(`
		$count <- 0
		for 10 count +<- 1
		<: count
		`);
		eq(res, NUM(10));
	});
});

describe('for of', () => {
	it('standard', async () => {
		const res = await exe(`
		#msgs = []
		each #item, ["ai", "chan", "kawaii"] {
			Arr:push(msgs, Arr:join([item, "!"]))
		}
		<: msgs
		`);
		eq(res, ARR([STR('ai!'), STR('chan!'), STR('kawaii!')]));
	});

	it('Break', async () => {
		const res = await exe(`
		#msgs = []
		each #item, ["ai", "chan", "kawaii"] {
			if (item = "kawaii") break
			Arr:push(msgs, Arr:join([item, "!"]))
		}
		<: msgs
		`);
		eq(res, ARR([STR('ai!'), STR('chan!')]));
	});

	it('single statement', async () => {
		const res = await exe(`
		#msgs = []
		each #item, ["ai", "chan", "kawaii"] Arr:push(msgs, Arr:join([item, "!"]))
		<: msgs
		`);
		eq(res, ARR([STR('ai!'), STR('chan!'), STR('kawaii!')]));
	})
});

describe('namespace', () => {
	it('standard', async () => {
		const res = await exe(`
		<: Foo:bar()

		:: Foo {
			@bar() { "ai" }
		}
		`);
		eq(res, STR('ai'));
	});

	it('self ref', async () => {
		const res = await exe(`
		<: Foo:bar()

		:: Foo {
			#ai = "kawaii"
			@bar() { ai }
		}
		`);
		eq(res, STR('kawaii'));
	});

	it('assign variable', async () => {
		const res = await exe(`
		Foo:setMsg("hello")
		<: Foo:getMsg()

		:: Foo {
			$msg <- "ai"
			@setMsg(value) { Foo:msg <- value }
			@getMsg() { Foo:msg }
		}
		`);
		eq(res, STR('hello'));
	});

	it('increment', async () => {
		const res = await exe(`
		Foo:value +<- 10
		Foo:value -<- 5
		<: Foo:value

		:: Foo {
			$value <- 0
		}
		`);
		eq(res, NUM(5));
	});
});

describe('literal', () => {
	it('bool (true)', async () => {
		const res = await exe(`
		<: yes
		`);
		eq(res, BOOL(true));
	});

	it('bool (false)', async () => {
		const res = await exe(`
		<: no
		`);
		eq(res, BOOL(false));
	});

	it('bool (true) +', async () => {
		const res = await exe(`
		<: +
		`);
		eq(res, BOOL(true));
	});

	it('bool (false) -', async () => {
		const res = await exe(`
		<: -
		`);
		eq(res, BOOL(false));
	});

	it('arr (separated by comma)', async () => {
		const res = await exe(`
		<: [1, 2, 3]
		`);
		eq(res, ARR([NUM(1), NUM(2), NUM(3)]));
	});

	it('arr (separated by comma) (with trailing comma)', async () => {
		const res = await exe(`
		<: [1, 2, 3,]
		`);
		eq(res, ARR([NUM(1), NUM(2), NUM(3)]));
	});

	it('arr (separated by line break)', async () => {
		const res = await exe(`
		<: [
			1
			2
			3
		]
		`);
		eq(res, ARR([NUM(1), NUM(2), NUM(3)]));
	});

	it('arr (separated by line break and comma)', async () => {
		const res = await exe(`
		<: [
			1,
			2,
			3
		]
		`);
		eq(res, ARR([NUM(1), NUM(2), NUM(3)]));
	});

	it('arr (separated by line break and comma) (with trailing comma)', async () => {
		const res = await exe(`
		<: [
			1,
			2,
			3,
		]
		`);
		eq(res, ARR([NUM(1), NUM(2), NUM(3)]));
	});

	it('obj (separated by comma)', async () => {
		const res = await exe(`
		<: { a: 1, b: 2, c: 3 }
		`);
		eq(res, OBJ(new Map([['a', NUM(1)], ['b', NUM(2)], ['c', NUM(3)]])));
	})

	it('obj (separated by comma) (with trailing comma)', async () => {
		const res = await exe(`
		<: { a: 1, b: 2, c: 3, }
		`);
		eq(res, OBJ(new Map([['a', NUM(1)], ['b', NUM(2)], ['c', NUM(3)]])));
	})

	it('obj (separated by semicolon)', async () => {
		const res = await exe(`
		<: { a: 1; b: 2; c: 3 }
		`);
		eq(res, OBJ(new Map([['a', NUM(1)], ['b', NUM(2)], ['c', NUM(3)]])));
	});

	it('obj (separated by semicolon) (with trailing semicolon)', async () => {
		const res = await exe(`
		<: { a: 1; b: 2; c: 3; }
		`);
		eq(res, OBJ(new Map([['a', NUM(1)], ['b', NUM(2)], ['c', NUM(3)]])));
	});

	it('obj (separated by line break)', async () => {
		const res = await exe(`
		<: {
			a: 1
			b: 2
			c: 3
		}
		`);
		eq(res, OBJ(new Map([['a', NUM(1)], ['b', NUM(2)], ['c', NUM(3)]])));
	});

	it('obj (separated by line break and semicolon)', async () => {
		const res = await exe(`
		<: {
			a: 1;
			b: 2;
			c: 3
		}
		`);
		eq(res, OBJ(new Map([['a', NUM(1)], ['b', NUM(2)], ['c', NUM(3)]])));
	});

	it('obj (separated by line break and semicolon) (with trailing semicolon)', async () => {
		const res = await exe(`
		<: {
			a: 1;
			b: 2;
			c: 3;
		}
		`);
		eq(res, OBJ(new Map([['a', NUM(1)], ['b', NUM(2)], ['c', NUM(3)]])));
	});

	it('obj and arr (separated by line break)', async () => {
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

describe('meta', () => {
	it('default meta', async () => {
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
		it('valid', async () => {
			const res = getMeta(`
			### x "hoge"
			`);
			eq(res, new Map([
				['x', 'hoge']
			]));
		});
	});

	describe('Number', () => {
		it('valid', async () => {
			const res = getMeta(`
			### x 42
			`);
			eq(res, new Map([
				['x', 42]
			]));
		});
	});

	describe('Boolean', () => {
		it('valid', async () => {
			const res = getMeta(`
			### x yes
			`);
			eq(res, new Map([
				['x', true]
			]));
		});
	});

	describe('Null', () => {
		it('valid', async () => {
			const res = getMeta(`
			### x _
			`);
			eq(res, new Map([
				['x', null]
			]));
		});
	});

	describe('Array', () => {
		it('valid', async () => {
			const res = getMeta(`
			### x [1 2 3]
			`);
			eq(res, new Map([
				['x', [1, 2, 3]]
			]));
		});

		it('invalid', async () => {
			try {
				getMeta(`
				### x [1 (2 + 2) 3]
				`);
			} catch(e) {
				assert.ok(true);
				return;
			}
			assert.fail();
		});
	});

	describe('Object', () => {
		it('valid', async () => {
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

		it('invalid', async () => {
			try {
				getMeta(`
				### x { a: 1; b: (2 + 2); c: 3; }
				`);
			} catch(e) {
				assert.ok(true);
				return;
			}
			assert.fail();
		});
	});

	describe('Template', () => {
		it('invalid', async () => {
			try {
				getMeta(`
				### x \`foo {bar} baz\`
				`);
			} catch(e) {
				assert.ok(true);
				return;
			}
			assert.fail();
		});
	});

	describe('Expression', () => {
		it('invalid', async () => {
			try {
				getMeta(`
				### x (1 + 1)
				`);
			} catch(e) {
				assert.ok(true);
				return;
			}
			assert.fail();
		});
	});
});

describe('Attribute', () => {
	it('single attribute with function (str)', async () => {
		let node: Node;
		let attr: NAttr;
		const nodes = analyze(parse(`
		+ Event "Recieved"
		@onRecieved(data) {
			data
		}
		`));
		assert.equal(nodes.length, 1);
		node = nodes[0];
		if (node.type != 'def') assert.fail();
		assert.equal(node.name, 'onRecieved');
		assert.equal(node.attr.length, 1);
		// attribute 1
		attr = node.attr[0];
		if (attr.type != 'attr') assert.fail();
		assert.equal(attr.name, 'Event');
		if (attr.value.type != 'str') assert.fail();
		assert.equal(attr.value.value, 'Recieved');
	});

	it('multiple attributes with function (obj, str, bool)', async () => {
		let node: Node;
		let attr: NAttr;
		const nodes = analyze(parse(`
		+ Endpoint { path: "/notes/create"; }
		+ Desc "Create a note."
		+ Cat yes
		@createNote(text) {
			<: text
		}
		`));
		assert.equal(nodes.length, 1);
		node = nodes[0];
		if (node.type != 'def') assert.fail();
		assert.equal(node.name, 'createNote');
		assert.equal(node.attr.length, 3);
		// attribute 1
		attr = node.attr[0];
		if (attr.type != 'attr') assert.fail();
		assert.equal(attr.name, 'Endpoint');
		if (attr.value.type != 'obj') assert.fail();
		assert.equal(attr.value.value.size, 1);
		for (const [k, v] of attr.value.value) {
			if (k == 'path') {
				if (v.type != 'str') assert.fail();
				assert.equal(v.value, '/notes/create');
			}
			else {
				assert.fail();
			}
		}
		// attribute 2
		attr = node.attr[1];
		if (attr.type != 'attr') assert.fail();
		assert.equal(attr.name, 'Desc');
		if (attr.value.type != 'str') assert.fail();
		assert.equal(attr.value.value, 'Create a note.');
		// attribute 3
		attr = node.attr[2];
		if (attr.type != 'attr') assert.fail();
		assert.equal(attr.name, 'Cat');
		if (attr.value.type != 'bool') assert.fail();
		assert.equal(attr.value.value, true);
	});

	// TODO: attributed function in block
	// TODO: attribute target does not exist
});

describe('Location', () => {
	it('function', async () => {
		let node: Node;
		const nodes = analyze(parse(`
		@f(a) { a }
		`));
		assert.equal(nodes.length, 1);
		node = nodes[0];
		if (!node.loc) assert.fail();
		assert.deepEqual(node.loc, { start: 3, end: 13 });
	});
});

describe('std', () => {
	describe('Arr', () => {
		it('map', async () => {
			const res = await exe(`
			#arr = ["ai", "chan", "kawaii"]

			<: Arr:map(arr, @(item) { Arr:join([item, "!"]) })
			`);
			eq(res, ARR([STR('ai!'), STR('chan!'), STR('kawaii!')]));
		});

		it('filter', async () => {
			const res = await exe(`
			#arr = ["ai", "chan", "kawaii"]

			<: Arr:filter(arr, @(item) { Str:incl(item, "ai") })
			`);
			eq(res, ARR([STR('ai'), STR('kawaii')]));
		});

		it('reduce', async () => {
			const res = await exe(`
			#arr = [1, 2, 3, 4]

			<: Arr:reduce(arr, @(accumulator, currentValue) { (accumulator + currentValue) })
			`);
			eq(res, NUM(10));
		});
	});

	describe('Obj', () => {
		it('keys', async () => {
			const res = await exe(`
			#o = { a: 1; b: 2; c: 3; }

			<: Obj:keys(o)
			`);
			eq(res, ARR([STR('a'), STR('b'), STR('c')]));
		});

		it('kvs', async () => {
			const res = await exe(`
			#o = { a: 1; b: 2; c: 3; }

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
		it('len', async () => {
			const res = await exe(`
			<: Str:len("👍🏽🍆🌮")
			`);
			eq(res, NUM(3));
		});

		it('pick', async () => {
			const res = await exe(`
			<: Str:pick("👍🏽🍆🌮", 2)
			`);
			eq(res, STR('🍆'));
		});

		it('slice', async () => {
			const res = await exe(`
			<: Str:slice("Emojis 👍🏽 are 🍆 poison. 🌮s are bad.", 8, 15)
			`);
			eq(res, STR('👍🏽 are 🍆'));
		});

		it('split', async () => {
			const res = await exe(`
			<: Str:split("👍🏽🍆🌮")
			`);
			eq(res, ARR([STR('👍🏽'), STR('🍆'), STR('🌮')]));
		});
	});
});
