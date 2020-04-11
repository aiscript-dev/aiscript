/**
 * Tests!
 */

import * as assert from 'assert';
import { AiScript } from '../src/interpreter';
import { NUM, STR } from '../src/interpreter/value';
const parse = require('../built/parser/parser.js').parse;

const exe = (program: string): Promise<any> => new Promise(ok => {
	const aiscript = new AiScript({}, {
		out(value) {
			ok(value);
		},
	});

	const ast = parse(program);

	aiscript.exec(ast);
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
