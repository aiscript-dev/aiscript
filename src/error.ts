export class SyntaxError extends Error {
	constructor(details?: string) {
		let message = 'Syntax error.';
		if (details) {
			message += ` ${details}`;
		}
		super(message);
	}
}

export class SemanticError extends Error {
	constructor(details?: string) {
		let message = 'Semantic error.';
		if (details) {
			message += ` ${details}`;
		}
		super(message);
	}
}
