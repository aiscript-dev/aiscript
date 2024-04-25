/* eslint-disable @typescript-eslint/no-explicit-any */

export abstract class AiScriptError extends Error {
	// name is read by Error.prototype.toString
	public name = 'AiScript';
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

/**
 * Wrapper for non-AiScript errors.
 */
export class NonAiScriptError extends AiScriptError {
	public name = 'Internal';
	constructor(error: any) {
		super(error.message ?? `${error}`, error);
	}
}

/**
 * Parse-time errors.
 */
export class AiScriptSyntaxError extends AiScriptError {
	public name = 'Syntax';
	constructor(message: string, info?: any) {
		super(message, info);
	}
}
/**
 * Type validation(parser/plugins/validate-type) errors.
 */ 
export class AiScriptTypeError extends AiScriptError {
	public name = 'Type';
	constructor(message: string, info?: any) {
		super(message, info);
	}
}

/**
 * Interpret-time errors.
 */
export class AiScriptRuntimeError extends AiScriptError {
	public name = 'Runtime';
	constructor(message: string, info?: any) {
		super(message, info);
	}
}
/**
 * RuntimeError for illegal access to arrays.
 */
export class AiScriptIndexOutOfRangeError extends AiScriptRuntimeError {
	constructor(message: string, info?: any) {
		super(message, info);
	}
}
/**
 * Errors thrown by users.
 */
export class AiScriptUserError extends AiScriptRuntimeError {
	public name = '';
	constructor(message: string, info?: any) {
		super(message, info);
	}
}
