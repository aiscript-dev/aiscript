export enum TokenKind {
	EOF,
	Identifier,

	// literal
	NumberLiteral,
	StringLiteral,

	// template string
	Template,
	TemplateStringElement,
	TemplateExprElement,

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

	/** "!" */
	Not,
	/** "!=" */
	NotEq,
	/** "#" */
	Sharp,
	/** "#[" */
	OpenSharpBracket,
	/** "###" */
	Sharp3,
	/** "%" */
	Percent,
	/** "&&" */
	And2,
	/** "(" */
	OpenParen,
	/** ")" */
	CloseParen,
	/** "*" */
	Asterisk,
	/** "+" */
	Plus,
	/** "+=" */
	PlusEq,
	/** "," */
	Comma,
	/** "-" */
	Minus,
	/** "-=" */
	MinusEq,
	/** "." */
	Dot,
	/** "/" */
	Slash,
	/** ":" */
	Colon,
	/** "::" */
	Colon2,
	/** ";" */
	SemiColon,
	/** "<" */
	Lt,
	/** "<=" */
	LtEq,
	/** "<:" */
	Out,
	/** "=" */
	Eq,
	/** "==" */
	Eq2,
	/** "=>" */
	Arrow,
	/** ">" */
	Gt,
	/** ">=" */
	GtEq,
	/** "@" */
	At,
	/** "@(" */
	OpenAtParen,
	/** "[" */
	OpenBracket,
	/** "]" */
	CloseBracket,
	/** "^" */
	Hat,
	/** "{" */
	OpenBrace,
	/** "||" */
	Or2,
	/** "}" */
	CloseBrace,
}

export class Token {
	constructor(
		public kind: TokenKind,
		public spaceSkipped: boolean,
		/** for number literal, string literal */
		public value?: string,
		/** for template syntax */
		public children?: Token[],
	) { }
}

/**
 * - opts.value: for number literal, string literal
 * - opts.children: for template syntax
*/
export function TOKEN(kind: TokenKind, spaceSkipped: boolean, opts?: { value?: Token['value'], children?: Token['children'] }) {
	return new Token(kind, spaceSkipped, opts?.value, opts?.children);
}
