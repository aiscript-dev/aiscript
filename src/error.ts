import type { Value } from './interpreter/value';

export abstract class AiScriptError extends Error {
	public info?: any;

	constructor(message: string, info?: any) {
		super(message);

		this.info = info;

		// Maintains proper stack trace for where our error was thrown (only available on V8)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, AiScriptError);
		}
	}
}

export class SyntaxError extends AiScriptError {
	constructor(message: string, info?: any) {
		super(message, info);
	}
}

export class TypeError extends AiScriptError {
	constructor(message: string, info?: any) {
		super(message, info);
	}
}

export class RuntimeError extends AiScriptError {
	constructor(message: string, info?: any) {
		super(message, info);
	}
}

export class IndexOutOfRangeError extends RuntimeError {
	constructor(message: string, info?: any) {
		super(message, info);
	}
}

// return文でスコープ抜け出しを行う用
// 関数定義ブロックがcatchしなかったらそのままエラーとして扱う
export class ReturnError extends AiScriptError {
	public nodeType = 'return';
	constructor(
		public val: Value,
		message: string,
		info?: any,
	) {
		super(message, info);
	}
}
// break/continue文でスコープ抜け出しを行う用
// loop/for/eachがcatchしなかったらそのままエラーとして扱う
export class BreakError extends AiScriptError {
	constructor(
		public nodeType: 'break'|'continue',
		message: string,
		info?: any,
	) {
		super(message, info);
	}
}
