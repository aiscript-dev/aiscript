export enum TokenKind {
	EOF,
	Identifier,

	// literal
	NumberLiteral,
	StringLiteral,

	// keyword
	NullKeyword,
	TrueKeyword,
	FalseKeyword,

	OpenParen,
	CloseParen,
	OpenBrace,
	CloseBrace,
	At,
}

export class Token {
	constructor(
		public kind: TokenKind,
		public value?: string,
	) { }
}

export function TOKEN(kind: TokenKind, value?: Token['value']) {
	return new Token(kind, value);
}
