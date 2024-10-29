import { describe, test } from "vitest";
import { utils } from '../src';
import { NUM, STR, NULL, ARR, OBJ, BOOL, TRUE, FALSE, ERROR ,FN_NATIVE } from '../src/interpreter/value';
import { exe, getMeta, eq } from './testutils';

describe('empty lines', () => {
    describe('match', () => {
		test.concurrent('empty line', async () => {
			const res = await exe(`
			<: match 1 {
				// comment
			}
			`);
			eq(res, NULL);
		});

		test.concurrent('empty line before case', async () => {
			const res = await exe(`
			<: match 1 {
				// comment
				case 1 => 1
			}
			`);
			eq(res, NUM(1));
		});

		test.concurrent('empty line after case', async () => {
			const res = await exe(`
			<: match 1 {
				case 1 => 1
				// comment
			}
			`);
			eq(res, NUM(1));
		});

		test.concurrent('empty line before default', async () => {
			const res = await exe(`
			<: match 1 {
				// comment
				default => 1
			}
			`);
			eq(res, NUM(1));
		});

		test.concurrent('empty line after default', async () => {
			const res = await exe(`
			<: match 1 {
				default => 1
				// comment
			}
			`);
			eq(res, NUM(1));
		});
    });

    describe('call', () => {
		test.concurrent('empty line', async () => {
			const res = await exe(`
			@f() {
				1
			}
			<:f(
				// comment
			)
			`);
			eq(res, NUM(1));
		});

		test.concurrent('empty line before', async () => {
			const res = await exe(`
			@f(a) {
				a
			}
			<:f(
				// comment
				1
			)
			`);
			eq(res, NUM(1));
		});

		test.concurrent('empty line after', async () => {
			const res = await exe(`
			@f(a) {
				a
			}
			<:f(
				1
				// comment
			)
			`);
			eq(res, NUM(1));
		});
    });

    describe('function params', () => {
		test.concurrent('empty line', async () => {
			const res = await exe(`
			@f(
				// comment
			) {
				1
			}
			<: f()
			`);
			eq(res, NUM(1));
		});

		test.concurrent('empty line before', async () => {
			const res = await exe(`
			@f(
				// comment
				a
			) {
				a
			}
			<: f(1)
			`);
			eq(res, NUM(1));
		});

		test.concurrent('empty line after', async () => {
			const res = await exe(`
			@f(
				a
				// comment
			) {
				a
			}
			<: f(1)
			`);
			eq(res, NUM(1));
		});
    });

    describe('if', () => {
        test.concurrent('empty line between if ~ elif', async () => {
            const res = await exe(`
            <: if true {
                1
            }
            // comment
            elif true {
                2
            }
            `);
            eq(res, NUM(1));
        });

        test.concurrent('empty line between if ~ elif ~ elif', async () => {
            const res = await exe(`
            <: if true {
                1
            }
            // comment
            elif true {
                2
            }
            // comment
            elif true {
                3
            }
            `);
            eq(res, NUM(1));
        });

        test.concurrent('empty line between if ~ else', async () => {
            const res = await exe(`
            <: if true {
                1
            }
            // comment
            else {
                2
            }
            `);
            eq(res, NUM(1));
        });

        test.concurrent('empty line between if ~ elif ~ else', async () => {
            const res = await exe(`
            <: if true {
                1
            }
            // comment
            elif true {
                2
            }
            // comment
            else {
                3
            }
            `);
            eq(res, NUM(1));
        });
    });

    describe('unary operation', () => {
        test.concurrent('empty line after', async () => {
            const res = await exe(`
            ! \\
            // comment
            true
            `);
            eq(res, BOOL(false));
        });
    });

    describe('binary operation', () => {
        test.concurrent('empty line before', async () => {
            const res = await exe(`
            <: 2 \\
            // comment
            * 3
            `);
            eq(res, NUM(6));
        });
    });

    describe('binary operation', () => {
        test.concurrent('empty line after', async () => {
            const res = await exe(`
            <: 2 * \\
            // comment
            3
            `);
            eq(res, NUM(6));
        });
    });

    describe('variable definition', () => {
        test.concurrent('empty line after equal', async () => {
            const res = await exe(`
            let a =
            // comment
            1
            <: a
            `);
            eq(res, NUM(1));
        });
    });

    describe('attribute', () => {
        test.concurrent('empty line after', async () => {
            const res = await exe(`
            #[abc]
            // comment
            let a = 1
            <: a
            `);
            eq(res, NUM(1));
        });
    });

    describe('obj literal', () => {
        test.concurrent('empty line', async () => {
            const res = await exe(`
            <: {
                // comment
            }
            `);
            eq(res, OBJ(new Map()));
        });

        test.concurrent('empty line before', async () => {
            const res = await exe(`
            let x = {
                // comment
                a: 1
            }
            <: x.a
            `);
            eq(res, NUM(1));
        });

        test.concurrent('empty line after', async () => {
            const res = await exe(`
            let x = {
                a: 1
                // comment
            }
            <: x.a
            `);
            eq(res, NUM(1));
        });
    });

    describe('arr literal', () => {
        test.concurrent('empty line', async () => {
            const res = await exe(`
            <: [
                // comment
            ]
            `);
            eq(res, ARR([]));
        });

        test.concurrent('empty line before', async () => {
            const res = await exe(`
            let x = [
                // comment
                1
            ]
            <: x[0]
            `);
            eq(res, NUM(1));
        });

        test.concurrent('empty line after', async () => {
            const res = await exe(`
            let x = [
                1
                // comment
            ]
            <: x[0]
            `);
            eq(res, NUM(1));
        });
    });
});
