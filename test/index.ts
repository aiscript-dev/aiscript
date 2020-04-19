/**
 * Tests!
 */

import * as assert from 'assert';
import { AiScript } from '../src/interpreter';
import { NUM, STR, NULL, ARR } from '../src/interpreter/value';
const parse = require('../built/parser/parser.js').parse;

const exe = (program: string): Promise<any> => new Promise((ok, err) => {
	const aiscript = new AiScript({}, {
		out(value) {
			ok(value);
		},
	});

	const ast = parse(program);

	aiscript.exec(ast).catch(err);
});

const eq = (a, b) => {
	assert.deepEqual(a.type, b.type);
	assert.deepEqual(a.value, b.value);
};

it('Hello, world!', async () => {
	const res = await exe('<: "Hello, world!"');
	eq(res, STR('Hello, world!'));
});

it('Escaped double quote', async () => {
	const res = await exe('<: "ai saw a note \\"bebeyo\\"."');
	eq(res, STR('ai saw a note "bebeyo".'));
});

it('(1 + 1)', async () => {
	const res = await exe('<: (1 + 1)');
	eq(res, NUM(2));
});

it('var', async () => {
	const res = await exe(`
	#a = 42
	<: a
	`);
	eq(res, NUM(42));
});

it('Fn call with no args', async () => {
	const res = await exe(`
	@f() {
		42
	}
	<: f()
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

it('Early return', async () => {
	const res = await exe(`
	@f() {
		? yes {
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
		? yes {
			? yes {
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
		? yes {
			<< "ai"
		}

		"pope"
	}

	@g() {
		? (f() = "ai") {
			<< "kawaii"
		}

		"pope"
	}

	<: g()
	`);
	eq(res, STR('kawaii'));
});

it('Block returns value', async () => {
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

it('Recursion', async () => {
	const res = await exe(`
	@fact(n) {
		? (n = 0) { 1 } ... { (fact((n - 1)) * n) }
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

it('Object property access', async () => {
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

it('Object property access (fn call)', async () => {
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

it('Array item access', async () => {
	const res = await exe(`
	#arr = ["ai", "chan", "kawaii"]

	<: arr[2]
	`);
	eq(res, STR('chan'));
});

it('Template syntax', async () => {
	const res = await exe(`
	<: \`1 + 1 = {Core:to_str((1 + 1))}\`
	`);
	eq(res, STR('1 + 1 = 2'));
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
			? (Core:type(v) = "arr") { c(v) } ... { v }
		}

		// rec
		@r(f, n) {
			? (n < L) {
				r(f(x(l[n])), (n + 1))
			} ... { f }
		}

		r(x(l[1]), 2)
	}

	#sksik = [s, [k, [s, i]], k]
	c([sksik, "foo", print])
	`);
	eq(res, STR('foo'));
});

describe('if', () => {
	it('?', async () => {
		const res1 = await exe(`
		$msg <- "ai"
		? yes {
			msg <- "kawaii"
		}
		<: msg
		`);
		eq(res1, STR('kawaii'));

		const res2 = await exe(`
		$msg <- "ai"
		? no {
			msg <- "kawaii"
		}
		<: msg
		`);
		eq(res2, STR('ai'));
	});

	it('...', async () => {
		const res1 = await exe(`
		$msg <- _
		? yes {
			msg <- "ai"
		} ... {
			msg <- "kawaii"
		}
		<: msg
		`);
		eq(res1, STR('ai'));

		const res2 = await exe(`
		$msg <- _
		? no {
			msg <- "ai"
		} ... {
			msg <- "kawaii"
		}
		<: msg
		`);
		eq(res2, STR('kawaii'));
	});

	it('...?', async () => {
		const res1 = await exe(`
		$msg <- "bebeyo"
		? no {
			msg <- "ai"
		} ...? yes {
			msg <- "kawaii"
		}
		<: msg
		`);
		eq(res1, STR('kawaii'));

		const res2 = await exe(`
		$msg <- "bebeyo"
		? no {
			msg <- "ai"
		} ...? no {
			msg <- "kawaii"
		}
		<: msg
		`);
		eq(res2, STR('bebeyo'));
	});

	it('...? ...', async () => {
		const res1 = await exe(`
		$msg <- _
		? no {
			msg <- "ai"
		} ...? yes {
			msg <- "chan"
		} ... {
			msg <- "kawaii"
		}
		<: msg
		`);
		eq(res1, STR('chan'));

		const res2 = await exe(`
		$msg <- _
		? no {
			msg <- "ai"
		} ...? no {
			msg <- "chan"
		} ... {
			msg <- "kawaii"
		}
		<: msg
		`);
		eq(res2, STR('kawaii'));
	});
});

describe('for', () => {
	it('standard', async () => {
		const res = await exe(`
		$count <- 0
		~ #i, 10 {
			count <- (count + i)
		}
		<: count
		`);
		eq(res, NUM(55));
	});

	it('wuthout iterator', async () => {
		const res = await exe(`
		$count <- 0
		~ 10 {
			count <- (count + 1)
		}
		<: count
		`);
		eq(res, NUM(10));
	});

	it('returns value', async () => {
		const res = await exe(`
		#items = ~ #i, 5 {
			i
		}
		<: items
		`);
		eq(res, ARR([NUM(1), NUM(2), NUM(3), NUM(4), NUM(5)]));
	});
});

describe('for of', () => {
	it('standard', async () => {
		const res = await exe(`
		$msgs <- []
		~~ #item, ["ai", "chan", "kawaii"] {
			msgs <- Arr:push(msgs, Arr:join([item, "!"]))
		}
		<: msgs
		`);
		eq(res, ARR([STR('ai!'), STR('chan!'), STR('kawaii!')]));
	});
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
});
