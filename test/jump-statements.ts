import * as assert from 'assert';
import { describe, expect, test } from 'vitest';
import { errors, utils } from '../src';
import { NUM, STR, NULL, ARR, OBJ, BOOL, TRUE, FALSE, ERROR ,FN_NATIVE } from '../src/interpreter/value';
import { AiScriptRuntimeError, AiScriptSyntaxError } from '../src/error';
import { exe, getMeta, eq } from './testutils';

describe('return', () => {
	test.concurrent('as statement', async () => {
		const res = await exe(`
		@f() {
			return 1
		}
		<: f()
		`);
		eq(res, NUM(1));
		await assert.rejects(() => exe('return 1'));
	});

	test.concurrent('in eval', async () => {
		const res = await exe(`
		@f() {
			let a = eval {
				return 1
			}
		}
		<: f()
		`);
		eq(res, NUM(1));
		await assert.rejects(() => exe('<: eval { return 1 }'));
	});

	describe('in if', () => {
		test.concurrent('cond', async () => {
			const res = await exe(`
			@f() {
				let a = if eval { return true } {}
			}
			<: f()
			`);
			eq(res, BOOL(true));
			await assert.rejects(() => exe('<: if eval { return true } {}'));
		});

		test.concurrent('then', async () => {
			const res = await exe(`
			@f() {
				let a = if true {
					return 1
				}
			}
			<: f()
			`);
			eq(res, NUM(1));
			await assert.rejects(() => exe('<: if true { return 1 }'));
		});

		test.concurrent('elif cond', async () => {
			const res = await exe(`
			@f() {
				let a = if false {} elif eval { return true } {}
			}
			<: f()
			`);
			eq(res, BOOL(true));
			await assert.rejects(() => exe('<: if false {} elif eval { return true } {}'));
		});

		test.concurrent('elif then', async () => {
			const res = await exe(`
			@f() {
				let a = if false {
				} elif true {
					return 1
				}
			}
			<: f()
			`);
			eq(res, NUM(1));
			await assert.rejects(() => exe('<: if false {} elif true eval { return true }'));
		});

		test.concurrent('else', async () => {
			const res = await exe(`
			@f() {
				let a = if false {
				} else {
					return 1
				}
			}
			<: f()
			`);
			eq(res, NUM(1));
			await assert.rejects(() => exe('<: if false {} else eval { return true }'));
		});
	});

	describe('in match', () => {
		test.concurrent('about', async () => {
			const res = await exe(`
			@f() {
				let a = match eval { return 1 } {}
			}
			<: f()
			`);
			eq(res, NUM(1));
			await assert.rejects(() => exe('<: match eval { return 1 } {}'));
		});

		test.concurrent('case q', async () => {
			const res = await exe(`
			@f() {
				let a = match 0 {
					case eval { return 0 } => {
						return 1
					}
				}
			}
			<: f()
			`);
			eq(res, NUM(0));
			await assert.rejects(() => exe('<: match 0 { case eval { return 0 } => {} }'))
		});

		test.concurrent('case a', async () => {
			const res = await exe(`
			@f() {
				let a = match 0 {
					case 0 => {
						return 1
					}
				}
			}
			<: f()
			`);
			eq(res, NUM(1));
			await assert.rejects(() => exe('<: match 0 { case 0 => { return 1 } }'))
		});

		test.concurrent('default', async () => {
			const res = await exe(`
			@f() {
				let a = match 0 {
					default => {
						return 1
					}
				}
			}
			<: f()
			`);
			eq(res, NUM(1));
			await assert.rejects(() => exe('<: match 0 { default => { return 1 } }'))
		});
	});

	describe('in binary operation', () => {
		test.concurrent('left', async () => {
			const res = await exe(`
			@f() {
				eval { return 1 } + 2
			}
			<: f()
			`);
			eq(res, NUM(1));
			await assert.rejects(() => exe('<: eval { return 1 } + 2'));
		});

		test.concurrent('right', async () => {
			const res = await exe(`
			@f() {
				1 + eval { return 2 }
			}
			<: f()
			`);
			eq(res, NUM(2));
			await assert.rejects(() => exe('<: 1 + eval { return 2 }'));
		});
	});

	describe('in call', () => {
		test.concurrent('callee', async () => {
			const res = await exe(`
			@f() {
				eval { return print }('Hello, world!')
			}
			f()('Hi')
			`);
			eq(res, STR('Hi'));
			await assert.rejects(() => exe(`eval { return print }('Hello, world!')`));
		});

		test.concurrent('arg', async () => {
			const res = await exe(`
			@f() {
				print(eval { return 'Hello, world!' })
			}
			<: f()
			`);
			eq(res, STR('Hello, world!'));
			await assert.rejects(() => exe(`print(eval { return 'Hello, world' })`))
		});
	});

	describe('in for', () => {
		test.concurrent('times', async () => {
			const res = await exe(`
			@f() {
				for eval { return 1 } {}
			}
			<: f()
			`);
			eq(res, NUM(1));
			await assert.rejects(() => exe('for eval { return 1 } {}'));
		});

		test.concurrent('from', async () => {
			const res = await exe(`
			@f() {
				for let i = eval { return 1 }, 2 {}
			}
			<: f()
			`);
			eq(res, NUM(1));
			await assert.rejects(() => exe('for let i = eval { return 1 }, 2 {}'));
		});

		test.concurrent('to', async () => {
			const res = await exe(`
			@f() {
				for let i = 0, eval { return 1 } {}
			}
			<: f()
			`);
			eq(res, NUM(1));
			await assert.rejects(() => exe('for let i = 0, eval { return 1 } {}'));
		});

		test.concurrent('for', async () => {
			const res = await exe(`
			@f() {
				for 1 {
					return 1
				}
			}
			<: f()
			`);
			eq(res, NUM(1));
			await assert.rejects(() => exe('for 1 { return 1 }'));
		})
	});

	describe('in each', () => {
		test.concurrent('items', async () => {
			const res = await exe(`
			@f() {
				each let v, [eval { return 1 }] {}
			}
			<: f()
			`);
			eq(res, NUM(1));
			await assert.rejects(() => exe('each let v, [eval { return 1 }] {}'));
		});

		test.concurrent('for', async () => {
			const res = await exe(`
			@f() {
				each let v, [0] {
					return 1
				}
			}
			<: f()
			`);
			eq(res, NUM(1));
			await assert.rejects(() => exe('each let v, [0] { return 1 }'));
		});
	});

	describe('in assign', () => {
		test.concurrent('expr', async () => {
			const res = await exe(`
			@f() {
				let a = null
				a = eval { return 1 }
			}
			<: f()
			`);
			eq(res, NUM(1));
			await assert.rejects(() => exe('let a = null; a = eval { return 1 }'));
		});

		test.concurrent('index target', async () => {
			const res = await exe(`
			@f() {
				let a = [null]
				eval { return a }[0] = 1
			}
			<: f()
			`);
			eq(res, ARR([NULL]));
			await assert.rejects(() => exe('let a = [null]; eval { return a }[0] = 1'));
		});

		test.concurrent('index', async () => {
			const res = await exe(`
			@f() {
				let a = [null]
				a[eval { return 0 }] = 1
			}
			<: f()
			`);
			eq(res, NUM(0));
			await assert.rejects(() => exe('let a = [null]; a[eval { return 0 }] = 1'));
		});

		test.concurrent('prop target', async () => {
			const res = await exe(`
			@f() {
				let o = {}
				eval { return o }.p = 1
			}
			<: f()
			`);
			eq(res, OBJ(new Map()));
			await assert.rejects(() => exe('let o = {}; eval { return o }.p = 1'));
		});

		test.concurrent('arr', async () => {
			const res = await exe(`
			@f() {
				let o = {}
				[eval { return o }.p] = [1]
			}
			<: f()
			`);
			eq(res, OBJ(new Map()));
			await assert.rejects(() => exe('let o = {}; [eval { return o }.p] = [1]'));
		});

		test.concurrent('obj', async () => {
			const res = await exe(`
			@f() {
				let o = {}
				{ a: eval { return o }.p } = { a: 1 }
			}
			<: f()
			`);
			eq(res, OBJ(new Map()));
			await assert.rejects(() => exe('let o = {}; { a: eval { return o }.p } = { a: 1 }'));
		});
	});

	describe('in add assign', () => {
		test.concurrent('dest', async () => {
			const res = await exe(`
			@f() {
				let a = [0]
				a[eval { return 0 }] += 1
			}
			<: f()
			`);
			eq(res, NUM(0));
			await assert.rejects(() => exe('let a = [0]; a[eval { return 0 }] += 1'));
		});

		test.concurrent('expr', async () => {
			const res = await exe(`
			@f() {
				let a = 0
				a += eval { return 1 }
			}
			<: f()
			`);
			eq(res, NUM(1));
			await assert.rejects(() => exe('let a = 0; a += eval { return 1 }'));
		});
	});

	describe('in sub assign', () => {
		test.concurrent('dest', async () => {
			const res = await exe(`
			@f() {
				let a = [0]
				a[eval { return 0 }] -= 1
			}
			<: f()
			`);
			eq(res, NUM(0));
			await assert.rejects(() => exe('let a = [0]; a[eval { return 0 }] -= 1'));
		});

		test.concurrent('expr', async () => {
			const res = await exe(`
			@f() {
				let a = 0
				a -= eval { return 1 }
			}
			<: f()
			`);
			eq(res, NUM(1));
			await assert.rejects(() => exe('let a = 0; a -= eval { return 1 }'));
		});
	});

	test.concurrent('in array', async () => {
		const res = await exe(`
		@f() {
			let a = [eval { return 1 }]
		}
		<: f()
		`);
		eq(res, NUM(1));
		await assert.rejects(() => exe('<: [eval { return 1 }]'));
	});

	test.concurrent('in object', async () => {
		const res = await exe(`
		@f() {
			let o = {
				p: eval { return 1 }
			}
		}
		<: f()
		`);
		eq(res, NUM(1));
		await assert.rejects(() => exe('<: { p: eval { return 1 } }'));
	});

	test.concurrent('in prop', async () => {
		const res = await exe(`
		@f() {
			let p = {
				p: eval { return 1 }
			}.p
		}
		<: f()
		`);
		eq(res, NUM(1));
		await assert.rejects(() => exe('<: { p: eval { return 1 } }.p'));
	});

	describe('in index', () => {
		test.concurrent('target', async () => {
			const res = await exe(`
			@f() {
				let v = [eval { return 1 }][0]
			}
			<: f()
			`);
			eq(res, NUM(1));
			await assert.rejects(() => exe('<: [eval { return 1 }][0]'));
		});

		test.concurrent('index', async () => {
			const res = await exe(`
			@f() {
				let v = [1][eval { return 0 }]
			}
			<: f()
			`);
			eq(res, NUM(0));
			await assert.rejects(() => exe('<: [0][eval { return 1 }]'));
		});
	});

	test.concurrent('in not', async () => {
		const res = await exe(`
		@f() {
			let b = !eval { return true }
		}
		<: f()
		`);
		eq(res, BOOL(true));
		await assert.rejects(() => exe('<: !eval { return true }'));
	});

	test.concurrent('in function default param', async () => {
		const res = await exe(`
		@f() {
			let g = @(x = eval { return 1 }) {}
		}
		<: f()
		`);
		eq(res, NUM(1));
		await assert.rejects(() => exe('<: @(x = eval { return 1 }){}'), errors.AiScriptSyntaxError);
		await assert.rejects(() => exe('<: @(a = @(b = eval { return 0 }){}){}'), errors.AiScriptSyntaxError);
	});

	test.concurrent('in template', async () => {
		const res = await exe(`
		@f() {
			let s = \`{eval { return 1 }}\`
		}
		<: f()
		`);
		eq(res, NUM(1));
		await assert.rejects(() => exe('<: `{eval {return 1}}`'));
	});

	test.concurrent('in return', async () => {
		const res = await exe(`
		@f() {
			return eval { return 1 } + 2
		}
		<: f()
		`);
		eq(res, NUM(1));
		await assert.rejects(() => exe('return eval { return 1 } + 2'));
	});

	describe('in break', () => {
		test.concurrent('valid', async () => {
			const res = await exe(`
			@f() {
				#l: eval {
					break #l eval { return 1 }
				}
			}
			<: f()
			`);
			eq(res, NUM(1));
		});

		test.concurrent('invalid', async () => {
			await expect(() => exe(`
			#l: eval {
				break #l eval { return 1 }
			}
			`)).rejects.toThrow(AiScriptSyntaxError);
		});
	});

	describe('in and', async () => {
		test.concurrent('left', async () => {
			const res = await exe(`
			@f() {
				eval { return 1 } && false
			}
			<: f()
			`);
			eq(res, NUM(1));
			await assert.rejects(() => exe('eval { return 1 } && false'));
		});

		test.concurrent('right', async () => {
			const res = await exe(`
			@f() {
				true && eval { return 1 }
			}
			<: f()
			`);
			eq(res, NUM(1));
			await assert.rejects(() => exe('true && eval { return 1 }'));
		});
	});

	describe('in or', async () => {
		test.concurrent('left', async () => {
			const res = await exe(`
			@f() {
				eval { return 1 } || false
			}
			<: f()
			`);
			eq(res, NUM(1));
			await assert.rejects(() => exe('eval { return 1 } || false'));
		});

		test.concurrent('right', async () => {
			const res = await exe(`
			@f() {
				false || eval { return 1 }
			}
			<: f()
			`);
			eq(res, NUM(1));
			await assert.rejects(() => exe('false || eval { return 1 }'));
		});
	});
});

describe('break', () => {
	test.concurrent('as statement', async () => {
		const res = await exe(`
		var x = 0
		for 1 {
			break
			x += 1
		}
		<: x
		`);
		eq(res, NUM(0));
		await assert.rejects(() => exe('break'));
		await assert.rejects(() => exe('@() { break }()'));
	});

	test.concurrent('in eval', async () => {
		const res = await exe(`
		var x = 0
		for 1 {
			let a = eval {
				break
			}
			x += 1
		}
		<: x
		`);
		eq(res, NUM(0));
		await assert.rejects(() => exe('<: eval { break }'));
	});

	test.concurrent('in if', async () => {
		const res = await exe(`
		var x = 0
		for 1 {
			let a = if true {
				break
			}
			x += 1
		}
		<: x
		`);
		eq(res, NUM(0));
		await assert.rejects(() => exe('<: if true { break }'));
	});

	test.concurrent('in match', async () => {
		const res = await exe(`
		var x = 0
		for 1 {
			let a = match 0 {
				default => break
			}
			x += 1
		}
		<: x
		`);
		eq(res, NUM(0));
		await assert.rejects(() => exe('<: if true { break }'));
	});

	test.concurrent('in function', async () => {
		await assert.rejects(() => exe(`
		for 1 {
			@f() {
				break;
			}
		}
		`));
	});

	test.concurrent('invalid label', async () => {
		await assert.rejects(() => exe(`
		for 1 {
			break #l
		}
		`));
	});

	test.concurrent('invalid value', async () => {
		await assert.rejects(() => exe(`
		#l: for 1 {
			break #l 1
		}
		`), new AiScriptSyntaxError('break corresponding to statement cannot include value', { line: 3, column: 4 }));
	});

	test.concurrent('invalid block', async () => {
		await assert.rejects(
			() => exe('#l: if true { continue #l }'),
			new AiScriptSyntaxError('cannot use continue for if', { line: 1, column: 15 }),
		);
		await assert.rejects(
			() => exe('#l: match 0 { default => continue #l }'),
			new AiScriptSyntaxError('cannot use continue for match', { line: 1, column: 26 }),
		);
		await assert.rejects(
			() => exe('#l: eval { continue #l }'),
			new AiScriptSyntaxError('cannot use continue for eval', { line: 1, column: 12 }),
		);
	});

	test.concurrent('break corresponding to each is not allowed in the target', async () => {
		await assert.rejects(
			() => exe('#l: each let i, eval { break #l } {}'),
			new AiScriptSyntaxError('break corresponding to each is not allowed in the target', { line: 1, column: 24 }),
		);
	});

	test.concurrent('break corresponding to for is not allowed in the count', async () => {
		await assert.rejects(
			() => exe('#l: for eval { break #l } {}'),
			new AiScriptSyntaxError('break corresponding to for is not allowed in the count', { line: 1, column: 16 }),
		);
	});

	describe('break corresponding to for is not allowed in the range', () => {
		test.concurrent('from', async () => {
			await assert.rejects(
				() => exe('#l: for let i = eval { break #l }, 0 {}'),
				new AiScriptSyntaxError('break corresponding to for is not allowed in the range', { line: 1, column: 24 }),
			);
		});

		test.concurrent('to', async () => {
			await assert.rejects(
				() => exe('#l: for let i = 0, eval { break #l } {}'),
				new AiScriptSyntaxError('break corresponding to for is not allowed in the range', { line: 1, column: 27 }),
			);
		});
	});

	describe('break corresponding to if is not allowed in the condition', () => {
		test.concurrent('if', async () => {
			await assert.rejects(
				() => exe('#l: if eval { break #l } {}'),
				new AiScriptSyntaxError('break corresponding to if is not allowed in the condition', { line: 1, column: 15 }),
			);
		});

		test.concurrent('elif', async () => {
			await assert.rejects(
				() => exe('#l: if false {} elif eval { break #l } {}'),
				new AiScriptSyntaxError('break corresponding to if is not allowed in the condition', { line: 1, column: 29 }),
			);
		});
	});

	test.concurrent('break corresponding to match is not allowed in the target', async () => {
		await assert.rejects(
			() => exe('#l: match eval { break #l } {}'),
			new AiScriptSyntaxError('break corresponding to match is not allowed in the target', { line: 1, column: 18 }),
		);
	});

	test.concurrent('break corresponding to match is not allowed in the pattern', async () => {
		await assert.rejects(
			() => exe('#l: match 0 { case eval { break #l } => 1 }'),
			new AiScriptSyntaxError('break corresponding to match is not allowed in the pattern', { line: 1, column: 27 }),
		);
	});

	describe('labeled each', () => {
		test.concurrent('inner each', async () => {
			const res = await exe(`
			var x = 0
			#l: each let v, [0] {
				each let v, [0] {
					x = 1
					break #l
				}
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner for', async () => {
			const res = await exe(`
			var x = 0
			#l: each let v, [0] {
				for 1 {
					x = 1
					break #l
				}
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner loop', async () => {
			const res = await exe(`
			var x = 0
			#l: each let v, [0] {
				loop {
					x = 1
					break #l
				}
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner do-while', async () => {
			const res = await exe(`
			var x = 0
			#l: each let v, [0] {
				do {
					x = 1
					break #l
				} while false
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner while', async () => {
			const res = await exe(`
			var x = 0
			#l: each let v, [0] {
				while true {
					x = 1
					break #l
				}
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});
	});

	describe('labeled for', () => {
		test.concurrent('inner each', async () => {
			const res = await exe(`
			var x = 0
			#l: for 1 {
				each let v, [0] {
					x = 1
					break #l
				}
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner for', async () => {
			const res = await exe(`
			var x = 0
			#l: for 1 {
				for 1 {
					x = 1
					break #l
				}
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner loop', async () => {
			const res = await exe(`
			var x = 0
			#l: for 1 {
				loop {
					x = 1
					break #l
				}
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner do-while', async () => {
			const res = await exe(`
			var x = 0
			#l: for 1 {
				do {
					x = 1
					break #l
				} while false
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner while', async () => {
			const res = await exe(`
			var x = 0
			#l: for 1 {
				while true {
					x = 1
					break #l
				}
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});
	});

	describe('labeled loop', () => {
		test.concurrent('inner each', async () => {
			const res = await exe(`
			var x = 0
			#l: loop {
				each let v, [0] {
					x = 1
					break #l
				}
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner for', async () => {
			const res = await exe(`
			var x = 0
			#l: loop {
				for 1 {
					x = 1
					break #l
				}
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner loop', async () => {
			const res = await exe(`
			var x = 0
			#l: loop {
				loop {
					x = 1
					break #l
				}
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner do-while', async () => {
			const res = await exe(`
			var x = 0
			#l: loop {
				do {
					x = 1
					break #l
				} while false
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner while', async () => {
			const res = await exe(`
			var x = 0
			#l: loop {
				while true {
					x = 1
					break #l
				}
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});
	});

	describe('labeled do-while', () => {
		test.concurrent('inner each', async () => {
			const res = await exe(`
			var x = 0
			#l: do {
				each let v, [0] {
					x = 1
					break #l
				}
				x = 2
			} while false
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner for', async () => {
			const res = await exe(`
			var x = 0
			#l: do {
				for 1 {
					x = 1
					break #l
				}
				x = 2
			} while false
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner loop', async () => {
			const res = await exe(`
			var x = 0
			#l: do {
				loop {
					x = 1
					break #l
				}
				x = 2
			} while false
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner do-while', async () => {
			const res = await exe(`
			var x = 0
			#l: do {
				do {
					x = 1
					break #l
				} while false
				x = 2
			} while false
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner while', async () => {
			const res = await exe(`
			var x = 0
			#l: do {
				while true {
					x = 1
					break #l
				}
				x = 2
			} while false
			<: x
			`);
			eq(res, NUM(1));
		});
	});

	describe('labeled while', () => {
		test.concurrent('inner each', async () => {
			const res = await exe(`
			var x = 0
			#l: while true {
				each let v, [0] {
					x = 1
					break #l
				}
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner for', async () => {
			const res = await exe(`
			var x = 0
			#l: while true {
				for 1 {
					x = 1
					break #l
				}
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner loop', async () => {
			const res = await exe(`
			var x = 0
			#l: while true {
				loop {
					x = 1
					break #l
				}
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner do-while', async () => {
			const res = await exe(`
			var x = 0
			#l: while true {
				do {
					x = 1
					break #l
				} while false
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner while', async () => {
			const res = await exe(`
			var x = 0
			#l: while true {
				while true {
					x = 1
					break #l
				}
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});
	});

	describe('labeled if', () => {
		test.concurrent('simple break', async () => {
			const res = await exe(`
			<: #l: if true {
				break #l
				2
			}
			`);
			eq(res, NULL);
		});

		test.concurrent('break with value', async () => {
			const res = await exe(`
			<: #l: if true {
				break #l 1
				2
			}
			`);
			eq(res, NUM(1));
		});
	});

	describe('labeled match', () => {
		test.concurrent('simple break', async () => {
			const res = await exe(`
			<: #l: match 0 {
				default => {
					break #l
					2
				}
			}
			`);
			eq(res, NULL);
		});

		test.concurrent('break with value', async () => {
			const res = await exe(`
			<: #l: match 0 {
				default => {
					break #l 1
					2
				}
			}
			`);
			eq(res, NUM(1));
		});
	});

	describe('labeled eval', () => {
		test.concurrent('simple break', async () => {
			const res = await exe(`
			<: #l: eval {
				break #l
				2
			}
			`);
			eq(res, NULL);
		});

		test.concurrent('break with value', async () => {
			const res = await exe(`
			<: #l: eval {
				break #l 1
				2
			}
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner while', async () => {
			const res = await exe(`
			<: #l: eval {
					while true {
							if true break #l 1
					}
			}
			`);
			eq(res, NUM(1));
		});
	});
});

describe('continue', () => {
	test.concurrent('as statement', async () => {
		const res = await exe(`
		var x = 0
		for 1 {
			continue
			x += 1
		}
		<: x
		`);
		eq(res, NUM(0));
		await assert.rejects(() => exe('continue'));
		await assert.rejects(() => exe('@() { continue }()'));
	});

	test.concurrent('in eval', async () => {
		const res = await exe(`
		var x = 0
		for 1 {
			let a = eval {
				continue
			}
			x += 1
		}
		<: x
		`);
		eq(res, NUM(0));
		await assert.rejects(() => exe('<: eval { continue }'));
	});

	test.concurrent('in if', async () => {
		const res = await exe(`
		var x = 0
		for 1 {
			let a = if true {
				continue
			}
			x += 1
		}
		<: x
		`);
		eq(res, NUM(0));
		await assert.rejects(() => exe('<: if true { continue }'));
	});

	test.concurrent('in match', async () => {
		const res = await exe(`
		var x = 0
		for 1 {
			let a = match 0 {
				default => continue
			}
			x += 1
		}
		<: x
		`);
		eq(res, NUM(0));
		await assert.rejects(() => exe('<: if true { continue }'));
	});

	test.concurrent('in function', async () => {
		await assert.rejects(() => exe(`
		for 1 {
			@f() {
				continue;
			}
		}
		`));
	});

	test.concurrent('invalid label', async () => {
		await assert.rejects(() => exe(`
		for 1 {
			continue #l
		}
		`));
	});

	describe('labeled each', () => {
		test.concurrent('inner each', async () => {
			const res = await exe(`
			var x = 0
			#l: each let v, [0] {
				each let v, [0] {
					x = 1
					continue #l
				}
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner for', async () => {
			const res = await exe(`
			var x = 0
			#l: each let v, [0] {
				for 1 {
					x = 1
					continue #l
				}
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner loop', async () => {
			const res = await exe(`
			var x = 0
			#l: each let v, [0] {
				loop {
					x = 1
					continue #l
				}
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner do-while', async () => {
			const res = await exe(`
			var x = 0
			#l: each let v, [0] {
				do {
					x = 1
					continue #l
				} while false
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner while', async () => {
			const res = await exe(`
			var x = 0
			#l: each let v, [0] {
				while true {
					x = 1
					continue #l
				}
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});
	});

	test.concurrent('continue corresponding to each is not allowed in the target', async () => {
		await assert.rejects(
			() => exe('#l: each let i, eval { continue #l } {}'),
			new AiScriptSyntaxError('continue corresponding to each is not allowed in the target', { line: 1, column: 24 }),
		);
	});

	test.concurrent('continue corresponding to for is not allowed in the count', async () => {
		await assert.rejects(
			() => exe('#l: for eval { continue #l } {}'),
			new AiScriptSyntaxError('continue corresponding to for is not allowed in the count', { line: 1, column: 16 }),
		);
	});

	describe('continue corresponding to for is not allowed in the range', () => {
		test.concurrent('from', async () => {
			await assert.rejects(
				() => exe('#l: for let i = eval { continue #l }, 0 {}'),
				new AiScriptSyntaxError('continue corresponding to for is not allowed in the range', { line: 1, column: 24 }),
			);
		});

		test.concurrent('to', async () => {
			await assert.rejects(
				() => exe('#l: for let i = 0, eval { continue #l } {}'),
				new AiScriptSyntaxError('continue corresponding to for is not allowed in the range', { line: 1, column: 27 }),
			);
		});
	});

	describe('labeled for', () => {
		test.concurrent('inner each', async () => {
			const res = await exe(`
			var x = 0
			#l: for 1 {
				each let v, [0] {
					x = 1
					continue #l
				}
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner for', async () => {
			const res = await exe(`
			var x = 0
			#l: for 1 {
				for 1 {
					x = 1
					continue #l
				}
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner loop', async () => {
			const res = await exe(`
			var x = 0
			#l: for 1 {
				loop {
					x = 1
					continue #l
				}
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner do-while', async () => {
			const res = await exe(`
			var x = 0
			#l: for 1 {
				do {
					x = 1
					continue #l
				} while false
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner while', async () => {
			const res = await exe(`
			var x = 0
			#l: for 1 {
				while true {
					x = 1
					continue #l
				}
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});
	});

	describe('labeled while', () => {
		test.concurrent('inner each', async () => {
			const res = await exe(`
			var x = 0
			#l: while x == 0 {
				each let v, [0] {
					x = 1
					continue #l
				}
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner for', async () => {
			const res = await exe(`
			var x = 0
			#l: while x == 0 {
				for 1 {
					x = 1
					continue #l
				}
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner loop', async () => {
			const res = await exe(`
			var x = 0
			#l: while x == 0 {
				loop {
					x = 1
					continue #l
				}
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner do-while', async () => {
			const res = await exe(`
			var x = 0
			#l: while x == 0 {
				do {
					x = 1
					continue #l
				} while false
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});

		test.concurrent('inner while', async () => {
			const res = await exe(`
			var x = 0
			#l: while x == 0 {
				while true {
					x = 1
					continue #l
				}
				x = 2
			}
			<: x
			`);
			eq(res, NUM(1));
		});
	});
});

describe('label', () => {
	test.concurrent('invalid statement', async () => {
		await assert.rejects(
			() => exe('#l: null'),
			new AiScriptSyntaxError('cannot use label for statement other than eval / if / match / for / each / while / do-while / loop', { line: 1, column: 5 }),
		);
	});

	test.concurrent('invalid expression', async () => {
		await assert.rejects(
			() => exe('let a = #l: null'),
			new AiScriptSyntaxError('cannot use label for expression other than eval / if / match', { line: 1, column: 13 }),
		);
	});

	test.concurrent('invalid space', async () => {
		await assert.rejects(
			() => exe('# l: eval { null }'),
			new AiScriptSyntaxError('cannot use spaces in a label', { line: 1, column: 3 }),
		);
		await assert.rejects(
			() => exe('#l: eval { break # l }'),
			new AiScriptSyntaxError('cannot use spaces in a label', { line: 1, column: 20 }),
		);
	});
});
