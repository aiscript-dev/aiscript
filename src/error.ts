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

/**
 * Wrapper for non-AiScript errors.
 */
export class NonAiScriptError extends AiScriptError {
	constructor(error: any) {
		super(`Internal Error. ${error}`, error);
	}
}

/**
 * Parse-time errors.
 */
export class AiScriptSyntaxError extends AiScriptError {
	constructor(message: string, info?: any) {
		super(message, info);
	}
}
/**
 * Type validation(parser/plugins/validate-type) errors.
 */ 
export class AiScriptTypeError extends AiScriptError {
	constructor(message: string, info?: any) {
		super(message, info);
	}
}

/**
 * Interpret-time errors.
 */
export class AiScriptRuntimeError extends AiScriptError {
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
