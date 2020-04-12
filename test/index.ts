/**
 * Tests!
 */

import * as assert from 'assert';
import { AiScript } from '../src/interpreter';
import { NUM, STR, NULL } from '../src/interpreter/value';
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
	assert.equal(a.type, b.type);
	assert.equal(a.value, b.value);
};

it('Hello, world!', async () => {
	const res = await exe('<: "Hello, world!"');
	eq(res, STR('Hello, world!'));
});

it('(1 + 1)', async () => {
	const res = await exe('<: (1 + 1)');
	eq(res, NUM(2));
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

it('Array item access', async () => {
	const res = await exe(`
#arr = ["ai", "chan", "kawaii"]

<: arr[2]
	`);
	eq(res, STR('chan'));
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
