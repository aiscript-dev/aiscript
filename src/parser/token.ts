export enum TokenKind {
	EOF,
	NewLine,
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
	DoKeyword,
	WhileKeyword,
	BreakKeyword,
	ContinueKeyword,
	MatchKeyword,
	CaseKeyword,
	DefaultKeyword,
	IfKeyword,
	ElifKeyword,
	ElseKeyword,
	ReturnKeyword,
	EvalKeyword,
	VarKeyword,
	LetKeyword,
	ExistsKeyword,
	DicKeyword,

	/** "!" */
	Not,
	/** "!=" */
	NotEq,
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
	/** "?" */
	Question,
	/** "@" */
	At,
	/** "[" */
	OpenBracket,
	/** "\\" */
	BackSlash,
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

export type TokenPosition = { column: number, line: number };

export class Token {
	constructor(
		public kind: TokenKind,
		public pos: TokenPosition,
		public hasLeftSpacing = false,
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
export function TOKEN(kind: TokenKind, pos: TokenPosition, opts?: { hasLeftSpacing?: boolean, value?: Token['value'], children?: Token['children'] }): Token {
	return new Token(kind, pos, opts?.hasLeftSpacing, opts?.value, opts?.children);
}
