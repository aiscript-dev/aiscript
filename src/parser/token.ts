import { unexpectedTokenError } from './utils.js';

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

type TokenBase = {
	kind: TokenKind;
	pos: TokenPosition;
	hasLeftSpacing: boolean;
};

export type EOFToken = TokenBase & {
	kind: TokenKind.EOF;
};

export type SimpleToken = TokenBase & {
	kind: Exclude<
		TokenKind,
		TokenKind.EOF
		| TokenKind.Identifier
		| TokenKind.NumberLiteral
		| TokenKind.StringLiteral
		| TokenKind.Template
		| TokenKind.TemplateStringElement
		| TokenKind.TemplateExprElement
	>;
}

/** for number literal, string literal */
export type IdentifierOrLiteralToken = TokenBase & {
	kind: TokenKind.Identifier | TokenKind.NumberLiteral | TokenKind.StringLiteral;
	value: string;
};

/** for template syntax */
export type TemplateToken = TokenBase & {
	kind: TokenKind.Template;
	children: (EOFToken | TemplateExprToken | TemplateStringToken)[];
};

export type TemplateStringToken = TokenBase & {
	kind: TokenKind.TemplateStringElement;
	value: string;
};

export type TemplateExprToken = TokenBase & {
	kind: TokenKind.TemplateExprElement;
	children: NormalToken[];
};

export type NormalToken = EOFToken | SimpleToken | IdentifierOrLiteralToken | TemplateToken;

export type Token = NormalToken | TemplateStringToken | TemplateExprToken;

export function TOKEN(
	kind: EOFToken['kind'],
	pos: TokenPosition,
	opts?: Omit<EOFToken, 'kind' | 'pos'>,
): EOFToken;
export function TOKEN(
	kind: SimpleToken['kind'],
	pos: TokenPosition,
	opts: Omit<SimpleToken, 'kind' | 'pos'>,
): SimpleToken;
export function TOKEN(
	kind: IdentifierOrLiteralToken['kind'],
	pos: TokenPosition,
	opts: Omit<IdentifierOrLiteralToken, 'kind' | 'pos'>,
): IdentifierOrLiteralToken;
export function TOKEN(
	kind: TemplateToken['kind'],
	pos: TokenPosition,
	opts: Omit<TemplateToken, 'kind' | 'pos'>,
): TemplateToken;
export function TOKEN(
	kind: TemplateStringToken['kind'],
	pos: TokenPosition,
	opts: Omit<TemplateStringToken, 'kind' | 'pos'>,
): TemplateStringToken;
export function TOKEN(
	kind: TemplateExprToken['kind'],
	pos: TokenPosition,
	opts: Omit<TemplateExprToken, 'kind' | 'pos'>,
): TemplateExprToken;
export function TOKEN(
	kind: TokenBase['kind'],
	pos: TokenPosition,
	opts?: Omit<TokenBase, 'kind' | 'pos'>,
): TokenBase {
	if (opts == null) {
		return { kind, pos, hasLeftSpacing: false };
	} else {
		return { kind, pos, ...opts };
	}
}

export function expectTokenKind<T extends TokenKind>(token: Token, kind: T): asserts token is Token & { kind: T } {
	if (token.kind !== kind) {
		throw unexpectedTokenError(token.kind, token.pos);
	}
}
