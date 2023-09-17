export enum TokenKind {
	EOF,
	Identifier,
	Literal,

	OpenParen,
	CloseParen,

	OpenBrace,
	CloseBrace,

	At,
}

export class Token {
	constructor(
		public kind: TokenKind,
		public literal?: Literal,
	) { }
}

export function TOKEN(kind: TokenKind) {
	return new Token(kind);
}

export type Literal = NumberLiteral | StringLiteral;

export class NumberLiteral {
	kind = 'NumberLiteral' as const;
	constructor(
		public value: number
	) { }
}

export class StringLiteral {
	kind = 'StringLiteral' as const;
	constructor(
		public value: string
	) { }
}
