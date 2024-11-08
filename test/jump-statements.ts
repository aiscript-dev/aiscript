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
                let a = if eval { return true } {}
            }
            <: f()
            `);
            eq(res, BOOL(true));
            assert.rejects(() => exe('<: if eval { return true } {}'));
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
                let a = if false {} elif eval { return true } {}
            }
            <: f()
            `);
            eq(res, BOOL(true));
            assert.rejects(() => exe('<: if false {} elif eval { return true } {}'));
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
            assert.rejects(() => exe('<: if false {} elif true eval { return true }'));
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
            assert.rejects(() => exe('<: if false {} else eval { return true }'));
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
            assert.rejects(() => exe('<: match eval { return 1 } {}'));
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
            assert.rejects(() => exe('<: match 0 { case eval { return 0 } => {} }'))
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
                eval { return 1 } + 2
            }
            <: f()
            `);
            eq(res, NUM(1));
            assert.rejects(() => exe('<: eval { return 1 } + 2'));
        });

        test.concurrent('right', async () => {
            const res = await exe(`
            @f() {
                1 + eval { return 2 }
            }
            <: f()
            `);
            eq(res, NUM(2));
            assert.rejects(() => exe('<: 1 + eval { return 2 }'));
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
            assert.rejects(() => exe(`eval { return print }('Hello, world!')`));
        });

        test.concurrent('arg', async () => {
            const res = await exe(`
            @f() {
                print(eval { return 'Hello, world!' })
            }
            <: f()
            `);
            eq(res, STR('Hello, world!'));
            assert.rejects(() => exe(`print(eval { return 'Hello, world' })`))
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
            assert.rejects(() => exe('for eval { return 1 } {}'));
        });

        test.concurrent('from', async () => {
            const res = await exe(`
            @f() {
                for let i = eval { return 1 }, 2 {}
            }
            <: f()
            `);
            eq(res, NUM(1));
            assert.rejects(() => exe('for let i = eval { return 1 }, 2 {}'));
        });

        test.concurrent('to', async () => {
            const res = await exe(`
            @f() {
                for let i = 0, eval { return 1 } {}
            }
            <: f()
            `);
            eq(res, NUM(1));
            assert.rejects(() => exe('for let i = 0, eval { return 1 } {}'));
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
                each let v, [eval { return 1 }] {}
            }
            <: f()
            `);
            eq(res, NUM(1));
            assert.rejects(() => exe('each let v, [eval { return 1 }] {}'));
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
                a = eval { return 1 }
            }
            <: f()
            `);
            eq(res, NUM(1));
            assert.rejects(() => exe('let a = null; a = eval { return 1 }'));
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
            assert.rejects(() => exe('let a = [null]; eval { return a }[0] = 1'));
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
            assert.rejects(() => exe('let a = [null]; a[eval { return 0 }] = 1'));
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
            assert.rejects(() => exe('let o = {}; eval { return o }.p = 1'));
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
            assert.rejects(() => exe('let o = {}; [eval { return o }.p] = [1]'));
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
            assert.rejects(() => exe('let o = {}; { a: eval { return o }.p } = { a: 1 }'));
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
            assert.rejects(() => exe('let a = [0]; a[eval { return 0 }] += 1'));
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
            assert.rejects(() => exe('let a = 0; a += eval { return 1 }'));
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
            assert.rejects(() => exe('let a = [0]; a[eval { return 0 }] -= 1'));
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
            assert.rejects(() => exe('let a = 0; a -= eval { return 1 }'));
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
        assert.rejects(() => exe('<: [eval { return 1 }]'));
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
        assert.rejects(() => exe('<: { p: eval { return 1 } }'));
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
        assert.rejects(() => exe('<: { p: eval { return 1 } }.p'));
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
            assert.rejects(() => exe('<: [eval { return 1 }][0]'));
        });

        test.concurrent('index', async () => {
            const res = await exe(`
            @f() {
                let v = [1][eval { return 0 }]
            }
            <: f()
            `);
            eq(res, NUM(0));
            assert.rejects(() => exe('<: [0][eval { return 1 }]'));
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
        assert.rejects(() => exe('<: !eval { return true }'));
    });

    test.concurrent('in function default param', async () => {
        const res = await exe(`
        @f() {
            let g = @(x = eval { return 1 }) {}
        }
        <: f()
        `);
        eq(res, NUM(1));
        assert.rejects(() => exe('<: @(x = eval { return 1 }){}'));
    });

    test.concurrent('in template', async () => {
        const res = await exe(`
        @f() {
            let s = \`{eval { return 1 }}\`
        }
        <: f()
        `);
        eq(res, NUM(1));
        assert.rejects(() => exe('<: `{eval {return 1}}`'));
    });

    test.concurrent('in return', async () => {
        const res = await exe(`
        @f() {
            return eval { return 1 } + 2
        }
        <: f()
        `);
        eq(res, NUM(1));
        assert.rejects(() => exe('return eval { return 1 } + 2'));
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
            assert.rejects(() => exe('eval { return 1 } && false'));
        });

        test.concurrent('right', async () => {
            const res = await exe(`
            @f() {
                true && eval { return 1 }
            }
            <: f()
            `);
            eq(res, NUM(1));
            assert.rejects(() => exe('true && eval { return 1 }'));
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
            assert.rejects(() => exe('eval { return 1 } || false'));
        });

        test.concurrent('right', async () => {
            const res = await exe(`
            @f() {
                false || eval { return 1 }
            }
            <: f()
            `);
            eq(res, NUM(1));
            assert.rejects(() => exe('false || eval { return 1 }'));
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
});
