import { describe, expect, test } from 'vitest';
import { Parser } from '../src/index.js';
import { AiScriptSyntaxError } from '../src/error.js';

function parse(script: string): void {
	const parser = new Parser({
		staticAnalysis: true,
	});
	parser.parse(script);
}

function expectOk(script: string): void {
	parse(script);
}

function expectError(script: string): void {
	expect(() => parse(script)).toThrow(AiScriptSyntaxError);
}

test.concurrent('empty', () => {
	expectOk('');
});

describe('namespace', () => {
	// TODO
	test.concurrent.skip('variable exists, inner', () => {
		expectOk(`
		:: Ns {
			let x = 0
			let y = x
		}
		`);
	});

	// TODO
	test.concurrent.skip('variable exists, outer', () => {
		expectOk(`
		:: Ns {
			let x = 0
		}
		let y = Ns:x
		`);
	});

	// TODO
	test.concurrent.skip('variable exists, nested, inner', () => {
		expectOk(`
		:: A {
			:: B {
				let x = 0
				let y = x
			}
		}
		`);
	});

	// TODO
	test.concurrent.skip('variable exists, nested, outer', () => {
		expectOk(`
		:: A {
			:: B {
				let x = 0
			}
		}
		let y = A:B:x
		`);
	});

	test.concurrent('variable not exists', () => {
		expectError(`
		:: Ns {
			let x = 0
			let y = z
		}
		`);
	});

	test.concurrent('destructing assignment is invalid', () => {
		expectError(`
		:: Ns {
			let [x, y] = [0, 1]
		}
		`);
	});
});

describe('variable definition', () => {
	describe('null', () => {
		test.concurrent('ok', () => {
			expectOk(`
			let x: null = null
			`);
		});
	});

	test.concurrent('name collision', () => {
		expectError(`
		let x = 1
		let x = 2
		`);
	});
});

describe('assignment', () => {
	test.concurrent('variable exists', () => {
		expectOk(`
		var x = 0
		x = 1
		`);
	});

	test.concurrent('variable not exists', () => {
		expectError(`
		x = 1
		`);
	});

	test.concurrent('compatible type', () => {
		expectOk(`
		var x: num = 0
		x = 1
		`);
	})

	test.concurrent('incompatible type', () => {
		expectError(`
		var x: num = 0
		x = "str"
		`);
	})
});

describe('type inference', () => {
	describe('null', () => {
		test.concurrent('ok', () => {
			expectOk(`
			var x = null
			x = null
			`);
		});

		test.concurrent('error', () => {
			expectError(`
			var x = null
			x = 0
			`);
		});
	});

	describe('bool', () => {
		test.concurrent('ok', () => {
			expectOk(`
			var x = false
			x = true
			`);
		});

		test.concurrent('error', () => {
			expectError(`
			var x = false
			x = 0
			`);
		});
	});

	describe('num', () => {
		test.concurrent('ok', () => {
			expectOk(`
			var x = 0
			x = 1
			`);
		});

		test.concurrent('error', () => {
			expectError(`
			var x = 0
			x = ""
			`);
		});
	});

	describe('str', () => {
		test.concurrent('ok (string literal)', () => {
			expectOk(`
			var x = "a"
			x = "b"
			`);
		});

		test.concurrent('ok (template literal)', () => {
			expectOk(`
			var x = "a"
			x = \`b\`
			`);
		});

		test.concurrent('error (string literal)', () => {
			expectError(`
			var x = "a"
			x = 0
			`);
		});
	});

	describe('arr', () => {
		test.concurrent('ok (zero element)', () => {
			expectOk(`
			var x = []
			x = [0]
			`);
		});

		test.concurrent('ok (one element)', () => {
			expectOk(`
			var x = [0]
			x = [1]
			`);
		});

		test.concurrent('error (zero element)', () => {
			expectError(`
			var x = []
			x = 0
			`);
		});

		test.concurrent('error (one element)', () => {
			expectError(`
			var x = [1]
			x = [""]
			`);
		})
	});

	describe('obj', () => {
		test.concurrent('ok (zero entry)', () => {
			expectOk(`
			var x = {}
			x = { a: 0 }
			`);
		})

		test.concurrent('ok (one entry)', () => {
			expectOk(`
			var x = { a: 0 }
			x = { b: 1 }
			`);
		});
	});

	describe('fn and call', () => {
		test.concurrent('ok (zero argument)', () => {
			expectOk(`
			@f(): void {}
			f()
			`);
		});

		test.concurrent('ok (one argument)', () => {
			expectOk(`
			@f(a: num): void {}
			f(1)
			`);
		});

		test.concurrent('return: num', () => {
			expectOk(`
			@f(): num {
				1
			}
			let x = f()
			`);
		});

		test.concurrent('argument: implicit any type', () => {
			expectOk(`
			@f(a) {}
			f(1)
			`);
		});

		test.concurrent('return: implicit any type', () => {
			expectOk(`
			@f() {
				1
			}
			let x = f()
			`);
		});

		test.concurrent('no such function', () => {
			expectError(`
			f()
			`);
		});

		test.concurrent('not callable', () => {
			expectError(`
			let f: num = 0
			f()
			`);
		});

		test.concurrent('expected 0 argument, given 1 argument', () => {
			expectError(`
			@f() {}
			f(1)
			`);
		});

		test.concurrent('expected 1 argument, given 0 argument', () => {
			expectError(`
			@f(a: num) {}
			f()
			`);
		});

		test.concurrent('expected num, given str', () => {
			expectError(`
			@f(a: num) {}
			f("")
			`);
		});
	});

	describe('index', () => {
		test.concurrent('ok (explicit array type)', () => {
			expectOk(`
			let x: arr<num> = [0]
			let y: num = 0
			y = x[0]
			`);
		});

		test.concurrent('error (explicit array type)', () => {
			expectError(`
			let x: arr<num> = [0]
			let y: str = ""
			y = x[0]
			`);
		});

		test.concurrent('error (implicit array type)', () => {
			expectError(`
			let x = [0]
			let y: str = ""
			y = x[0]
			`);
		});

		test.concurrent('not such variable', () => {
			expectError(`
			x[0]
			`);
		});

		test.concurrent('has no prop', () => {
			expectError(`
			let x: num = 0
			x[0]
			`);
		});
	});

	describe('variable', () => {
		test.concurrent('explicit variable type', () => {
			expectOk(`
			let x: arr<num> = [0]
			let y: num = 0
			y = x[0]
			`);
		});
	});
});
