import * as assert from 'assert';
import { describe, test } from 'vitest';
import { utils } from '../src';
import { NUM, STR, NULL, ARR, OBJ, BOOL, TRUE, FALSE, ERROR ,FN_NATIVE } from '../src/interpreter/value';
import { AiScriptRuntimeError } from '../src/error';
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
		assert.rejects(() => exe('return 1'));
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
		assert.rejects(() => exe('<: eval { return 1 }'));
	});

	describe('in if', () => {
        test.concurrent('cond', async () => {
            const res = await exe(`
            @f() {
                let a = if (return true) {}
            }
            <: f()
            `);
            eq(res, BOOL(true));
            assert.rejects(() => exe('<: if (return true) {}'));
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
            assert.rejects(() => exe('<: if true { return 1 }'));
        });

        test.concurrent('elif cond', async () => {
            const res = await exe(`
            @f() {
                let a = if false {} elif (return true) {}
            }
            <: f()
            `);
            eq(res, BOOL(true));
            assert.rejects(() => exe('<: if false {} elif (return true) {}'));
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
            assert.rejects(() => exe('<: if false {} elif true (return true)'));
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
            assert.rejects(() => exe('<: if false {} else (return true)'));
        });
	});

	describe('in match', () => {
        test.concurrent('about', async () => {
            const res = await exe(`
            @f() {
                let a = match (return 1) {}
            }
            <: f()
            `);
            eq(res, NUM(1));
            assert.rejects(() => exe('<: match (return 1) {}'));
        });

        test.concurrent('case q', async () => {
            const res = await exe(`
            @f() {
                let a = match 0 {
                    case (return 0) => {
                        return 1
                    }
                }
            }
            <: f()
            `);
            eq(res, NUM(0));
            assert.rejects(() => exe('<: match 0 { case (return 0) => {} }'))
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
            assert.rejects(() => exe('<: match 0 { case 0 => { return 1 } }'))
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
            assert.rejects(() => exe('<: match 0 { default => { return 1 } }'))
        });
	});

    describe('in binary operation', () => {
        test.concurrent('left', async () => {
            const res = await exe(`
            @f() {
                (return 1) + 2
            }
            <: f()
            `);
            eq(res, NUM(1));
            assert.rejects(() => exe('<: (return 1) + 2'));
        });

        test.concurrent('right', async () => {
            const res = await exe(`
            @f() {
                1 + (return 2)
            }
            <: f()
            `);
            eq(res, NUM(2));
            assert.rejects(() => exe('<: 1 + (return 2)'));
        });
    });

    describe('in call', () => {
        test.concurrent('callee', async () => {
            const res = await exe(`
            @f() {
                (return print)('Hello, world!')
            }
            f()('Hi')
            `);
            eq(res, STR('Hi'));
            assert.rejects(() => exe(`(return print)('Hello, world!')`));
        });

        test.concurrent('arg', async () => {
            const res = await exe(`
            @f() {
                print(return 'Hello, world!')
            }
            <: f()
            `);
            eq(res, STR('Hello, world!'));
            assert.rejects(() => exe(`print(return 'Hello, world')`))
        });
    });

    describe('in for', () => {
        test.concurrent('times', async () => {
            const res = await exe(`
            @f() {
                for (return 1) {}
            }
            <: f()
            `);
            eq(res, NUM(1));
            assert.rejects(() => exe('for (return 1) {}'));
        });

        test.concurrent('from', async () => {
            const res = await exe(`
            @f() {
                for let i = (return 1), 2 {}
            }
            <: f()
            `);
            eq(res, NUM(1));
            assert.rejects(() => exe('for let i = (return 1), 2 {}'));
        });

        test.concurrent('to', async () => {
            const res = await exe(`
            @f() {
                for let i = 0, (return 1) {}
            }
            <: f()
            `);
            eq(res, NUM(1));
            assert.rejects(() => exe('for let i = 0, (return 1) {}'));
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
            assert.rejects(() => exe('for 1 { return 1 }'));
        })
    });

    describe('in each', () => {
        test.concurrent('items', async () => {
            const res = await exe(`
            @f() {
                each let v, [return 1] {}
            }
            <: f()
            `);
            eq(res, NUM(1));
            assert.rejects(() => exe('each let v, [return 1] {}'));
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
            assert.rejects(() => exe('each let v, [0] { return 1 }'));
        });
    });

    describe('in assign', () => {
        test.concurrent('expr', async () => {
            const res = await exe(`
            @f() {
                let a = null
                a = (return 1)
            }
            <: f()
            `);
            eq(res, NUM(1));
            assert.rejects(() => exe('let a = null; a = (return 1)'));
        });

        test.concurrent('index target', async () => {
            const res = await exe(`
            @f() {
                let a = [null]
                (return a)[0] = 1
            }
            <: f()
            `);
            eq(res, ARR([NULL]));
            assert.rejects(() => exe('let a = [null]; (return a)[0] = 1'));
        });

        test.concurrent('index', async () => {
            const res = await exe(`
            @f() {
                let a = [null]
                a[return 0] = 1
            }
            <: f()
            `);
            eq(res, NUM(0));
            assert.rejects(() => exe('let a = [null]; a[return 0] = 1'));
        });

        test.concurrent('prop target', async () => {
            const res = await exe(`
            @f() {
                let o = {}
                (return o).p = 1
            }
            <: f()
            `);
            eq(res, OBJ(new Map()));
            assert.rejects(() => exe('let o = {}; (return o).p = 1'));
        });

        test.concurrent('arr', async () => {
            const res = await exe(`
            @f() {
                let o = {}
                [(return o).p] = [1]
            }
            <: f()
            `);
            eq(res, OBJ(new Map()));
            assert.rejects(() => exe('let o = {}; [(return o).p] = [1]'));
        });

        test.concurrent('obj', async () => {
            const res = await exe(`
            @f() {
                let o = {}
                { a: (return o).p } = { a: 1 }
            }
            <: f()
            `);
            eq(res, OBJ(new Map()));
            assert.rejects(() => exe('let o = {}; { a: (return o).p } = { a: 1 }'));
        });
    });

    describe('in add assign', () => {
        test.concurrent('dest', async () => {
            const res = await exe(`
            @f() {
                let a = [0]
                a[return 0] += 1
            }
            <: f()
            `);
            eq(res, NUM(0));
            assert.rejects(() => exe('let a = [0]; a[return 0] += 1'));
        });

        test.concurrent('expr', async () => {
            const res = await exe(`
            @f() {
                let a = 0
                a += (return 1)
            }
            <: f()
            `);
            eq(res, NUM(1));
            assert.rejects(() => exe('let a = 0; a += (return 1)'));
        });
    });

    describe('in sub assign', () => {
        test.concurrent('dest', async () => {
            const res = await exe(`
            @f() {
                let a = [0]
                a[return 0] -= 1
            }
            <: f()
            `);
            eq(res, NUM(0));
            assert.rejects(() => exe('let a = [0]; a[return 0] -= 1'));
        });

        test.concurrent('expr', async () => {
            const res = await exe(`
            @f() {
                let a = 0
                a -= (return 1)
            }
            <: f()
            `);
            eq(res, NUM(1));
            assert.rejects(() => exe('let a = 0; a -= (return 1)'));
        });
    });

    test.concurrent('in array', async () => {
        const res = await exe(`
        @f() {
            let a = [return 1]
        }
        <: f()
        `);
        eq(res, NUM(1));
        assert.rejects(() => exe('<: [return 1]'));
    });

    test.concurrent('in object', async () => {
        const res = await exe(`
        @f() {
            let o = {
                p: (return 1)
            }
        }
        <: f()
        `);
        eq(res, NUM(1));
        assert.rejects(() => exe('<: { p: (return 1) }'));
    });

    test.concurrent('in prop', async () => {
        const res = await exe(`
        @f() {
            let p = {
                p: (return 1)
            }.p
        }
        <: f()
        `);
        eq(res, NUM(1));
        assert.rejects(() => exe('<: { p: (return 1) }.p'));
    });

    describe('in index', () => {
        test.concurrent('target', async () => {
            const res = await exe(`
            @f() {
                let v = [return 1][0]
            }
            <: f()
            `);
            eq(res, NUM(1));
            assert.rejects(() => exe('<: [return 1][0]'));
        });

        test.concurrent('index', async () => {
            const res = await exe(`
            @f() {
                let v = [1][return 0]
            }
            <: f()
            `);
            eq(res, NUM(0));
            assert.rejects(() => exe('<: [0][return 1]'));
        });
    });

    test.concurrent('in not', async () => {
        const res = await exe(`
        @f() {
            let b = !(return true)
        }
        <: f()
        `);
        eq(res, BOOL(true));
        assert.rejects(() => exe('<: !(return true)'));
    });

    test.concurrent('in function default param', async () => {
        const res = await exe(`
        @f() {
            let g = @(x = (return 1)) {}
        }
        <: f()
        `);
        eq(res, NUM(1));
        assert.rejects(() => exe('<: @(x = (return 1)){}'));
    });

    test.concurrent('in template', async () => {
        const res = await exe(`
        @f() {
            let s = \`{(return 1)}\`
        }
        <: f()
        `);
        eq(res, NUM(1));
        assert.rejects(() => exe('<: `{eval {return 1}}`'));
    });

    test.concurrent('in return', async () => {
        const res = await exe(`
        @f() {
            return (return 1) + 2
        }
        <: f()
        `);
        eq(res, NUM(1));
        assert.rejects(() => exe('return (return 1) + 2'));
    });

    describe('in and', async () => {
        test.concurrent('left', async () => {
            const res = await exe(`
            @f() {
                (return 1) && false
            }
            <: f()
            `);
            eq(res, NUM(1));
            assert.rejects(() => exe('(return 1) && false'));
        });

        test.concurrent('right', async () => {
            const res = await exe(`
            @f() {
                true && (return 1)
            }
            <: f()
            `);
            eq(res, NUM(1));
            assert.rejects(() => exe('true && (return 1)'));
        });
    });

    describe('in or', async () => {
        test.concurrent('left', async () => {
            const res = await exe(`
            @f() {
                (return 1) || false
            }
            <: f()
            `);
            eq(res, NUM(1));
            assert.rejects(() => exe('(return 1) || false'));
        });

        test.concurrent('right', async () => {
            const res = await exe(`
            @f() {
                false || (return 1)
            }
            <: f()
            `);
            eq(res, NUM(1));
            assert.rejects(() => exe('false || (return 1)'));
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
		assert.rejects(() => exe('break'));
		assert.rejects(() => exe('@() { break }()'));
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
		assert.rejects(() => exe('<: eval { break }'));
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
		assert.rejects(() => exe('<: if true { break }'));
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
		assert.rejects(() => exe('<: if true { break }'));
	});

    test.concurrent('in function', async () => {
        assert.rejects(() => exe(`
        for 1 {
            @f() {
                break;
            }
        }
        `));
    });

    test.concurrent('as expr', async () => {
        const res = await exe(`
        var x = true
        for 1 {
            x = false || break
        }
        <: x
        `);
        eq(res, BOOL(true));
        assert.rejects(() => exe('<: false || break'));
    });

    test.concurrent('invalid label', async () => {
        assert.rejects(() => exe(`
        for 1 {
            break #l
        }
        `));
    });

    describe('with expr', () => {
        test.concurrent('in each', async () => {
            const res = await exe(`
            <: each let v, [0] {
                break 1
            }
            `);
            eq(res, NUM(1));
        });

        test.concurrent('in for', async () => {
            const res = await exe(`
            <: for 1 {
                break 1
            }
            `);
            eq(res, NUM(1));
        });

        test.concurrent('in loop', async () => {
            const res = await exe(`
            <: loop {
                break 1
            }
            `);
            eq(res, NUM(1));
        });

        test.concurrent('toplevel', async () => {
            assert.rejects(() => exe('break 1'));
        });
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

        describe('with expr', () => {
            test.concurrent('inner each', async () => {
                const res = await exe(`
                <: #l: if true {
                    each let v, [0] {
                        break #l 1
                    }
                }
                `);
                eq(res, NUM(1));
            });

            test.concurrent('inner for', async () => {
                const res = await exe(`
                <: #l: if true {
                    for 1 {
                        break #l 1
                    }
                }
                `);
                eq(res, NUM(1));
            });

            test.concurrent('inner loop', async () => {
                const res = await exe(`
                <: #l: if true {
                    loop {
                        break #l 1
                    }
                }
                `);
                eq(res, NUM(1));
            });

            test.concurrent('inner if', async () => {
                const res = await exe(`
                <: #l: if true {
                    if true {
                        break #l 1
                        2
                    }
                }
                `);
                eq(res, NUM(1));
            });

            test.concurrent('inner match', async () => {
                const res = await exe(`
                <: #l: if true {
                    match 0 {
                        default => {
                            break #l 1
                            2
                        }
                    }
                }
                `);
                eq(res, NUM(1));
            });
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
		assert.rejects(() => exe('continue'));
		assert.rejects(() => exe('@() { continue }()'));
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
		assert.rejects(() => exe('<: eval { continue }'));
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
		assert.rejects(() => exe('<: if true { continue }'));
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
		assert.rejects(() => exe('<: if true { continue }'));
	});

    test.concurrent('in function', async () => {
        assert.rejects(() => exe(`
        for 1 {
            @f() {
                continue;
            }
        }
        `));
    });

    test.concurrent('as expr', async () => {
        const res = await exe(`
        var x = true
        for 1 {
            x = false || continue
        }
        <: x
        `);
        eq(res, BOOL(true));
        assert.rejects(() => exe('<: false || continue'));
    });

    test.concurrent('invalid label', async () => {
        assert.rejects(() => exe(`
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
