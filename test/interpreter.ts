import * as assert from 'assert';
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { Parser, Interpreter, values, errors, utils, Ast } from '../src';

let { FN_NATIVE } = values;
let { AiScriptRuntimeError, AiScriptIndexOutOfRangeError, AiScriptHostsideError } = errors;

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
});

describe('error handler', () => {
	test.concurrent('error from outside caller', async () => {
		let outsideCaller: () => Promise<void> = async () => {};
		let errCount: number = 0;
		const aiscript = new Interpreter({
			emitError: FN_NATIVE((_args, _opts) => {
				throw Error('emitError');
			}),
			genOutsideCaller: FN_NATIVE(([fn], opts) => {
				utils.assertFunction(fn);
				outsideCaller = async () => {
					opts.topCall(fn, []);
				};
			}),
		}, {
			err(e) { /*console.log(e.toString());*/ errCount++ },
		});
		await aiscript.exec(Parser.parse(`
		genOutsideCaller(emitError)
		`));
		assert.strictEqual(errCount, 0);
		await outsideCaller();
		assert.strictEqual(errCount, 1);
	});

	test.concurrent('array.map calls the handler just once', async () => {
		let errCount: number = 0;
		const aiscript = new Interpreter({}, {
			err(e) { errCount++ },
		});
		await aiscript.exec(Parser.parse(`
		Core:range(1,5).map(@(){ hoge })
		`));
		assert.strictEqual(errCount, 1);
	});
});

describe('error location', () => {
	const exeAndGetErrPos = (src: string): Promise<Ast.Pos|undefined> => new Promise((ok, ng) => {
		const aiscript = new Interpreter({
			emitError: FN_NATIVE((_args, _opts) => {
				throw Error('emitError');
			}),
		}, {
			err(e) { ok(e.pos) },
		});
		aiscript.exec(Parser.parse(src)).then(() => ng('error has not occured.'));
	});

	test.concurrent('Non-aiscript Error', async () => {
		return expect(exeAndGetErrPos(`/* (の位置
			*/
			emitError()
		`)).resolves.toEqual({ line: 3, column: 13});
	});

	test.concurrent('No "var" in namespace declaration', async () => {
		return expect(exeAndGetErrPos(`// vの位置
			:: Ai {
				let chan = 'kawaii'
				var kun = '!?'
			}
		`)).resolves.toEqual({ line: 4, column: 5});
	});

	test.concurrent('Index out of range', async () => {
		return expect(exeAndGetErrPos(`// [の位置
			let arr = []
			arr[0]
		`)).resolves.toEqual({ line: 3, column: 7});
	});

	test.concurrent('Error in passed function', async () => {
		return expect(exeAndGetErrPos(`// (の位置
			[1, 2, 3].map(@(v){
				if v==1 Core:abort("error")
			})
		`)).resolves.toEqual({ line: 3, column: 23});
	});

	test.concurrent('No such prop', async () => {
		return expect(exeAndGetErrPos(`// .の位置
			[].ai
		`)).resolves.toEqual({ line: 2, column: 6});
	});
});

describe('callstack', () => {
	const exeAndGetErrMessage = (src: string): Promise<string> => new Promise((ok, ng) => {
		const aiscript = new Interpreter({
			emitError: FN_NATIVE((_args, _opts) => {
				throw Error('emitError');
			}),
		}, {
			err(e) { ok(e.message) },
		});
		aiscript.exec(Parser.parse(src)).then(() => ng('error has not occurred.'));
	});

	test('error in function', async () => {
		const result = await exeAndGetErrMessage(`
			@function1() { emitError() }
			@function2() { function1() }
			function2()
		`);
		expect(result).toMatchInlineSnapshot(`
			"emitError
			  at function1 (Line 2, Column 28)
			  at function2 (Line 3, Column 28)
			  at <root> (Line 4, Column 13)"
		`);
	});
	test('error in function in namespace', async () => {
		const result = await exeAndGetErrMessage(`
			:: Ai {
				@function() { emitError() }
			}
			Ai:function()
		`);
		expect(result).toMatchInlineSnapshot(`
			"emitError
			  at Ai:function (Line 3, Column 28)
			  at <root> (Line 5, Column 15)"
		`);
	});
	test('error in anonymous function', async () => {
		const result = await exeAndGetErrMessage(`
			(@() { emitError() })()
		`);
		expect(result).toMatchInlineSnapshot(`
			"emitError
			  at <anonymous> (Line 2, Column 20)
			  at <root> (Line 2, Column 25)"
		`);
	});
});

describe('IRQ', () => {
	describe('irqSleep is function', () => {
		async function countSleeps(irqRate: number): Promise<number> {
			let count = 0;
			const interpreter = new Interpreter({}, {
				irqRate,
				// It's safe only when no massive loop occurs
				irqSleep: async () => count++,
			});
			await interpreter.exec(Parser.parse(`
			'Ai-chan kawaii'
			'Ai-chan kawaii'
			'Ai-chan kawaii'
			'Ai-chan kawaii'
			'Ai-chan kawaii'
			'Ai-chan kawaii'
			'Ai-chan kawaii'
			'Ai-chan kawaii'
			'Ai-chan kawaii'
			'Ai-chan kawaii'`));
			return count;
		}

		test.concurrent.each([
			[0, 0],
			[1, 10],
			[2, 5],
			[10, 1],
			[Infinity, 0],
		])('rate = %d', async (rate, count) => {
			return expect(countSleeps(rate)).resolves.toEqual(count);
		});

		test.concurrent.each(
			[-1, NaN],
		)('rate = %d', async (rate, count) => {
			return expect(countSleeps(rate)).rejects.toThrow(AiScriptHostsideError);
		});
	});

	describe('irqSleep is number', () => {
		// This function does IRQ 10 times so takes 10 * irqSleep milliseconds in sum when executed.
		async function countSleeps(irqSleep: number): Promise<void> {
			const interpreter = new Interpreter({}, {
				irqRate: 1,
				irqSleep,
			});
			await interpreter.exec(Parser.parse(`
			'Ai-chan kawaii'
			'Ai-chan kawaii'
			'Ai-chan kawaii'
			'Ai-chan kawaii'
			'Ai-chan kawaii'
			'Ai-chan kawaii'
			'Ai-chan kawaii'
			'Ai-chan kawaii'
			'Ai-chan kawaii'
			'Ai-chan kawaii'`));
		}

		beforeEach(() => {
			vi.useFakeTimers();
		})

		afterEach(() => {
			vi.restoreAllMocks();
		})

		test('It ends', async () => {
			const countSleepsSpy = vi.fn(countSleeps);
			countSleepsSpy(100);
			await vi.advanceTimersByTimeAsync(1000);
			return expect(countSleepsSpy).toHaveResolved();
		});

		test('It takes time', async () => {
			const countSleepsSpy = vi.fn(countSleeps);
			countSleepsSpy(100);
			await vi.advanceTimersByTimeAsync(999);
			return expect(countSleepsSpy).not.toHaveResolved();
		});

		test.each(
			[-1, NaN]
		)('Invalid number: %d', (time) => {
			return expect(countSleeps(time)).rejects.toThrow(AiScriptHostsideError);
		});
	});
});
