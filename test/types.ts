import * as assert from 'assert';
import { describe, test } from 'vitest';
import { utils } from '../src';
import { NUM, STR, NULL, ARR, OBJ, BOOL, TRUE, FALSE, ERROR ,FN_NATIVE } from '../src/interpreter/value';
import { AiScriptRuntimeError } from '../src/error';
import { exe, getMeta, eq } from './testutils';

describe('generics', () => {
    describe('function', () => {
        test.concurrent('expr', async () => {
            const res = await exe(`
                let f = @<T>(v: T): void {}
                <: f("a")
            `);
            eq(res, NULL);
        });

        test.concurrent('consumer', async () => {
            const res = await exe(`
            @f<T>(v: T): void {}
            <: f("a")
            `);
            eq(res, NULL);
        });

        test.concurrent('identity function', async () => {
            const res = await exe(`
            @f<T>(v: T): T { v }
            <: f(1)
            `);
            eq(res, NUM(1));
        });

        test.concurrent('use as inner type', async () => {
            const res = await exe(`
            @vals<T>(v: obj<T>): arr<T> {
                Obj:vals(v)
            }
            <: vals({ a: 1, b: 2, c: 3 })
            `);
            eq(res, ARR([NUM(1), NUM(2), NUM(3)]));
        });

        test.concurrent('use as variable type', async () => {
            const res = await exe(`
            @f<T>(v: T): void {
                let v2: T = v
            }
            <: f(1)
            `);
            eq(res, NULL);
        });
    });
});
