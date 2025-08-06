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
	/** "|" */
	Or,
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

const KEYWORDS = [
	TokenKind.NullKeyword,
	TokenKind.TrueKeyword,
	TokenKind.FalseKeyword,
	TokenKind.EachKeyword,
	TokenKind.ForKeyword,
	TokenKind.LoopKeyword,
	TokenKind.DoKeyword,
	TokenKind.WhileKeyword,
	TokenKind.BreakKeyword,
	TokenKind.ContinueKeyword,
	TokenKind.MatchKeyword,
	TokenKind.CaseKeyword,
	TokenKind.DefaultKeyword,
	TokenKind.IfKeyword,
	TokenKind.ElifKeyword,
	TokenKind.ElseKeyword,
	TokenKind.ReturnKeyword,
	TokenKind.EvalKeyword,
	TokenKind.VarKeyword,
	TokenKind.LetKeyword,
	TokenKind.ExistsKeyword
] as const;

export type KeywordTokenKind = (typeof KEYWORDS)[number];

export function isKeywordTokenKind(token: TokenKind): token is KeywordTokenKind {
	return (KEYWORDS as readonly TokenKind[]).includes(token);
}

export function keywordTokenKindToString(token: KeywordTokenKind): string {
	switch (token) {
		case TokenKind.NullKeyword: return 'null';
		case TokenKind.TrueKeyword: return 'true';
		case TokenKind.FalseKeyword: return 'false';
		case TokenKind.EachKeyword: return 'each';
		case TokenKind.ForKeyword: return 'for';
		case TokenKind.LoopKeyword: return 'loop';
		case TokenKind.DoKeyword: return 'do';
		case TokenKind.WhileKeyword: return 'while';
		case TokenKind.BreakKeyword: return 'break';
		case TokenKind.ContinueKeyword: return 'continue';
		case TokenKind.MatchKeyword: return 'match';
		case TokenKind.CaseKeyword: return 'case';
		case TokenKind.DefaultKeyword: return 'default';
		case TokenKind.IfKeyword: return 'if';
		case TokenKind.ElifKeyword: return 'elif';
		case TokenKind.ElseKeyword: return 'else';
		case TokenKind.ReturnKeyword: return 'return';
		case TokenKind.EvalKeyword: return 'eval';
		case TokenKind.VarKeyword: return 'var';
		case TokenKind.LetKeyword: return 'let';
		case TokenKind.ExistsKeyword: return 'exists';
		default:
			// exhaustiveness check
			const _token: never = token;
			throw new Error(`Unknown keyword token kind ${_token}`);
	}
}
