/* eslint-disable prefer-const */

import * as assert from 'assert';
import { describe, test } from 'vitest';
import { Parser, Interpreter, Ast } from '../src';
import { NUM, STR, NULL, ARR, OBJ, BOOL, TRUE, FALSE, ERROR ,FN_NATIVE } from '../src/interpreter/value';
import { AiScriptSyntaxError, AiScriptRuntimeError, AiScriptIndexOutOfRangeError } from '../src/error';
import { exeSync, eq } from './testutils';

test.concurrent('Hello, world!', () => {
	const res = exeSync('"Hello, world!"');
	eq(res, STR('Hello, world!'));
});
