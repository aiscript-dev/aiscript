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
	EachKeyword,
	ForKeyword,
	LoopKeyword,
	BreakKeyword,
	ContinueKeyword,
	MatchKeyword,
	IfKeyword,
	ElifKeyword,
	ElseKeyword,
	ReturnKeyword,
	EvalKeyword,
	VarKeyword,
	LetKeyword,
	ExistsKeyword,

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
