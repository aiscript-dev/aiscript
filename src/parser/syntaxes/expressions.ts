import { AiScriptSyntaxError } from '../../error.js';
import { CALL_NODE, NODE } from '../utils.js';
import { TokenStream } from '../streams/token-stream.js';
import { TokenKind } from '../token.js';
import { parseBlock, parseParams, parseType } from './common.js';
import { parseBlockOrStatement } from './statements.js';

import type * as Ast from '../../node.js';
import type { ITokenStream } from '../streams/token-stream.js';

export function parseExpr(s: ITokenStream, isStatic: boolean): Ast.Node {
	if (isStatic) {
		return parseAtom(s, true);
	} else {
		return parsePratt(s, 0);
	}
}

// NOTE: infix(中置演算子)ではlbpを大きくすると右結合、rbpを大きくすると左結合の演算子になります。
// この値は演算子が左と右に対してどのくらい結合力があるかを表わしています。詳細はpratt parsingの説明ページを参照してください。

const operators: OpInfo[] = [
	{ opKind: 'postfix', kind: TokenKind.OpenParen, bp: 20 },
	{ opKind: 'postfix', kind: TokenKind.OpenBracket, bp: 20 },

	{ opKind: 'infix', kind: TokenKind.Dot, lbp: 18, rbp: 19 },

	{ opKind: 'infix', kind: TokenKind.Hat, lbp: 17, rbp: 16 },

	{ opKind: 'prefix', kind: TokenKind.Plus, bp: 14 },
	{ opKind: 'prefix', kind: TokenKind.Minus, bp: 14 },
	{ opKind: 'prefix', kind: TokenKind.Not, bp: 14 },

	{ opKind: 'infix', kind: TokenKind.Asterisk, lbp: 12, rbp: 13 },
	{ opKind: 'infix', kind: TokenKind.Slash, lbp: 12, rbp: 13 },
	{ opKind: 'infix', kind: TokenKind.Percent, lbp: 12, rbp: 13 },

	{ opKind: 'infix', kind: TokenKind.Plus, lbp: 10, rbp: 11 },
	{ opKind: 'infix', kind: TokenKind.Minus, lbp: 10, rbp: 11 },

	{ opKind: 'infix', kind: TokenKind.Lt, lbp: 8, rbp: 9 },
	{ opKind: 'infix', kind: TokenKind.LtEq, lbp: 8, rbp: 9 },
	{ opKind: 'infix', kind: TokenKind.Gt, lbp: 8, rbp: 9 },
	{ opKind: 'infix', kind: TokenKind.GtEq, lbp: 8, rbp: 9 },

	{ opKind: 'infix', kind: TokenKind.Eq2, lbp: 6, rbp: 7 },
	{ opKind: 'infix', kind: TokenKind.NotEq, lbp: 6, rbp: 7 },

	{ opKind: 'infix', kind: TokenKind.And2, lbp: 4, rbp: 5 },

	{ opKind: 'infix', kind: TokenKind.Or2, lbp: 2, rbp: 3 },
];

function parsePrefix(s: ITokenStream, minBp: number): Ast.Node {
	const loc = s.token.loc;
	const op = s.kind;
	s.next();

	// 改行のエスケープ
	if (s.kind === TokenKind.BackSlash) {
		s.next();
		s.nextWith(TokenKind.NewLine);
	}

	const expr = parsePratt(s, minBp);

	switch (op) {
		case TokenKind.Plus: {
			// 数値リテラル以外は非サポート
			if (expr.type === 'num') {
				return NODE('num', { value: expr.value }, loc);
			} else {
				throw new AiScriptSyntaxError('currently, sign is only supported for number literal.');
			}
			// TODO: 将来的にサポートされる式を拡張
			// return NODE('plus', { expr }, loc);
		}
		case TokenKind.Minus: {
			// 数値リテラル以外は非サポート
			if (expr.type === 'num') {
				return NODE('num', { value: -1 * expr.value }, loc);
			} else {
				throw new AiScriptSyntaxError('currently, sign is only supported for number literal.');
			}
			// TODO: 将来的にサポートされる式を拡張
			// return NODE('minus', { expr }, loc);
		}
		case TokenKind.Not: {
			return NODE('not', { expr }, loc);
		}
		default: {
			throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[op]}`);
		}
	}
}

function parseInfix(s: ITokenStream, left: Ast.Node, minBp: number): Ast.Node {
	const loc = s.token.loc;
	const op = s.kind;
	s.next();

	// 改行のエスケープ
	if (s.kind === TokenKind.BackSlash) {
		s.next();
		s.nextWith(TokenKind.NewLine);
	}

	if (op === TokenKind.Dot) {
		s.expect(TokenKind.Identifier);
		const name = s.token.value!;
		s.next();

		return NODE('prop', {
			target: left,
			name,
		}, loc);
	} else {
		const right = parsePratt(s, minBp);

		switch (op) {
			case TokenKind.Hat: {
				return CALL_NODE('Core:pow', [left, right], loc);
			}
			case TokenKind.Asterisk: {
				return CALL_NODE('Core:mul', [left, right], loc);
			}
			case TokenKind.Slash: {
				return CALL_NODE('Core:div', [left, right], loc);
			}
			case TokenKind.Percent: {
				return CALL_NODE('Core:mod', [left, right], loc);
			}
			case TokenKind.Plus: {
				return CALL_NODE('Core:add', [left, right], loc);
			}
			case TokenKind.Minus: {
				return CALL_NODE('Core:sub', [left, right], loc);
			}
			case TokenKind.Lt: {
				return CALL_NODE('Core:lt', [left, right], loc);
			}
			case TokenKind.LtEq: {
				return CALL_NODE('Core:lteq', [left, right], loc);
			}
			case TokenKind.Gt: {
				return CALL_NODE('Core:gt', [left, right], loc);
			}
			case TokenKind.GtEq: {
				return CALL_NODE('Core:gteq', [left, right], loc);
			}
			case TokenKind.Eq2: {
				return CALL_NODE('Core:eq', [left, right], loc);
			}
			case TokenKind.NotEq: {
				return CALL_NODE('Core:neq', [left, right], loc);
			}
			case TokenKind.And2: {
				return NODE('and', { left, right }, loc);
			}
			case TokenKind.Or2: {
				return NODE('or', { left, right }, loc);
			}
			default: {
				throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[op]}`);
			}
		}
	}
}

function parsePostfix(s: ITokenStream, expr: Ast.Node): Ast.Node {
	const loc = s.token.loc;
	const op = s.kind;

	switch (op) {
		case TokenKind.OpenParen: {
			return parseCall(s, expr);
		}
		case TokenKind.OpenBracket: {
			s.next();
			const index = parseExpr(s, false);
			s.nextWith(TokenKind.CloseBracket);

			return NODE('index', {
				target: expr,
				index,
			}, loc);
		}
		default: {
			throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[op]}`);
		}
	}
}

function parseAtom(s: ITokenStream, isStatic: boolean): Ast.Node {
	const loc = s.token.loc;

	switch (s.kind) {
		case TokenKind.IfKeyword: {
			if (isStatic) break;
			return parseIf(s);
		}
		case TokenKind.At: {
			if (isStatic) break;
			return parseFnExpr(s);
		}
		case TokenKind.MatchKeyword: {
			if (isStatic) break;
			return parseMatch(s);
		}
		case TokenKind.EvalKeyword: {
			if (isStatic) break;
			return parseEval(s);
		}
		case TokenKind.ExistsKeyword: {
			if (isStatic) break;
			return parseExists(s);
		}
		case TokenKind.Template: {
			const values: (string | Ast.Node)[] = [];

			if (isStatic) break;

			for (const element of s.token.children!) {
				switch (element.kind) {
					case TokenKind.TemplateStringElement: {
						values.push(NODE('str', { value: element.value! }, element.loc));
						break;
					}
					case TokenKind.TemplateExprElement: {
						// スキャナで埋め込み式として事前に読み取っておいたトークン列をパースする
						const exprStream = new TokenStream(element.children!);
						const expr = parseExpr(exprStream, false);
						if (exprStream.kind !== TokenKind.EOF) {
							throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[exprStream.token.kind]}`);
						}
						values.push(expr);
						break;
					}
					default: {
						throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[element.kind]}`);
					}
				}
			}

			s.next();
			return NODE('tmpl', { tmpl: values }, loc);
		}
		case TokenKind.StringLiteral: {
			const value = s.token.value!;
			s.next();
			return NODE('str', { value }, loc);
		}
		case TokenKind.NumberLiteral: {
			// TODO: validate number value
			const value = Number(s.token.value!);
			s.next();
			return NODE('num', { value }, loc);
		}
		case TokenKind.TrueKeyword:
		case TokenKind.FalseKeyword: {
			const value = (s.kind === TokenKind.TrueKeyword);
			s.next();
			return NODE('bool', { value }, loc);
		}
		case TokenKind.NullKeyword: {
			s.next();
			return NODE('null', { }, loc);
		}
		case TokenKind.OpenBrace: {
			return parseObject(s, isStatic);
		}
		case TokenKind.OpenBracket: {
			return parseArray(s, isStatic);
		}
		case TokenKind.Identifier: {
			if (isStatic) break;
			return parseReference(s);
		}
		case TokenKind.OpenParen: {
			s.next();
			const expr = parseExpr(s, isStatic);
			s.nextWith(TokenKind.CloseParen);
			return expr;
		}
	}
	throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[s.kind]}`);
}

/**
 * Call = "(" [Expr *(("," / SPACE) Expr)] ")"
*/
function parseCall(s: ITokenStream, target: Ast.Node): Ast.Node {
	const loc = s.token.loc;
	const items: Ast.Node[] = [];

	s.nextWith(TokenKind.OpenParen);

	while (s.kind !== TokenKind.CloseParen) {
		// separator
		if (items.length > 0) {
			if (s.kind === TokenKind.Comma) {
				s.next();
			} else if (!s.token.hasLeftSpacing) {
				throw new AiScriptSyntaxError('separator expected');
			}
		}

		items.push(parseExpr(s, false));
	}

	s.nextWith(TokenKind.CloseParen);

	return NODE('call', {
		target,
		args: items,
	}, loc);
}

/**
 * ```abnf
 * If = "if" Expr BlockOrStatement *("elif" Expr BlockOrStatement) ["else" BlockOrStatement]
 * ```
*/
function parseIf(s: ITokenStream): Ast.Node {
	const loc = s.token.loc;

	s.nextWith(TokenKind.IfKeyword);
	const cond = parseExpr(s, false);
	const then = parseBlockOrStatement(s);

	if (s.kind === TokenKind.NewLine && [TokenKind.ElifKeyword, TokenKind.ElseKeyword].includes(s.lookahead(1).kind)) {
		s.next();
	}

	const elseif: { cond: Ast.Node, then: Ast.Node }[] = [];
	while (s.kind === TokenKind.ElifKeyword) {
		s.next();
		const elifCond = parseExpr(s, false);
		const elifThen = parseBlockOrStatement(s);
		if ((s.kind as TokenKind) === TokenKind.NewLine && [TokenKind.ElifKeyword, TokenKind.ElseKeyword].includes(s.lookahead(1).kind)) {
			s.next();
		}
		elseif.push({ cond: elifCond, then: elifThen });
	}

	let _else = undefined;
	if (s.kind === TokenKind.ElseKeyword) {
		s.next();
		_else = parseBlockOrStatement(s);
	}

	return NODE('if', { cond, then, elseif, else: _else }, loc);
}

/**
 * ```abnf
 * FnExpr = "@" Params [":" Type] Block
 * ```
*/
function parseFnExpr(s: ITokenStream): Ast.Node {
	const loc = s.token.loc;

	s.nextWith(TokenKind.At);

	const params = parseParams(s);

	let type;
	if ((s.kind as TokenKind) === TokenKind.Colon) {
		s.next();
		type = parseType(s);
	}

	const body = parseBlock(s);

	return NODE('fn', { args: params, retType: type, children: body }, loc);
}

/**
 * ```abnf
 * Match = "match" Expr "{" *("case" Expr "=>" BlockOrStatement) ["default" "=>" BlockOrStatement] "}"
 * ```
*/
function parseMatch(s: ITokenStream): Ast.Node {
	const loc = s.token.loc;

	s.nextWith(TokenKind.MatchKeyword);
	const about = parseExpr(s, false);

	s.nextWith(TokenKind.OpenBrace);
	s.nextWith(TokenKind.NewLine);

	const qs: { q: Ast.Node, a: Ast.Node }[] = [];
	while (s.kind !== TokenKind.DefaultKeyword && s.kind !== TokenKind.CloseBrace) {
		s.nextWith(TokenKind.CaseKeyword);
		const q = parseExpr(s, false);
		s.nextWith(TokenKind.Arrow);
		const a = parseBlockOrStatement(s);
		s.nextWith(TokenKind.NewLine);
		qs.push({ q, a });
	}

	let x;
	if (s.kind === TokenKind.DefaultKeyword) {
		s.next();
		s.nextWith(TokenKind.Arrow);
		x = parseBlockOrStatement(s);
		s.nextWith(TokenKind.NewLine);
	}

	s.nextWith(TokenKind.CloseBrace);

	return NODE('match', { about, qs, default: x }, loc);
}

/**
 * ```abnf
 * Eval = "eval" Block
 * ```
*/
function parseEval(s: ITokenStream): Ast.Node {
	const loc = s.token.loc;

	s.nextWith(TokenKind.EvalKeyword);
	const statements = parseBlock(s);
	return NODE('block', { statements }, loc);
}

/**
 * ```abnf
 * Exists = "exists" Reference
 * ```
*/
function parseExists(s: ITokenStream): Ast.Node {
	const loc = s.token.loc;

	s.nextWith(TokenKind.ExistsKeyword);
	const identifier = parseReference(s);
	return NODE('exists', { identifier }, loc);
}

/**
 * ```abnf
 * Reference = IDENT *(":" IDENT)
 * ```
*/
function parseReference(s: ITokenStream): Ast.Node {
	const loc = s.token.loc;

	const segs: string[] = [];
	while (true) {
		if (segs.length > 0) {
			if (s.kind === TokenKind.Colon) {
				s.next();
			} else {
				break;
			}
		}
		s.expect(TokenKind.Identifier);
		segs.push(s.token.value!);
		s.next();
	}
	return NODE('identifier', { name: segs.join(':') }, loc);
}

/**
 * ```abnf
 * Object = "{" [IDENT ":" Expr *(("," / ";" / SPACE) IDENT ":" Expr) ["," / ";"]] "}"
 * ```
*/
function parseObject(s: ITokenStream, isStatic: boolean): Ast.Node {
	const loc = s.token.loc;

	s.nextWith(TokenKind.OpenBrace);

	if (s.kind === TokenKind.NewLine) {
		s.next();
	}

	const map = new Map();
	while (s.kind !== TokenKind.CloseBrace) {
		s.expect(TokenKind.Identifier);
		const k = s.token.value!;
		s.next();

		s.nextWith(TokenKind.Colon);

		const v = parseExpr(s, isStatic);

		map.set(k, v);

		// separator
		if ((s.kind as TokenKind) === TokenKind.CloseBrace) {
			break;
		} else if (s.kind === TokenKind.Comma) {
			s.next();
		} else if (s.kind === TokenKind.SemiColon) {
			s.next();
		} else if (s.kind === TokenKind.NewLine) {
			// noop
		} else {
			if (!s.token.hasLeftSpacing) {
				throw new AiScriptSyntaxError('separator expected');
			}
		}

		if (s.kind === TokenKind.NewLine) {
			s.next();
		}
	}

	s.nextWith(TokenKind.CloseBrace);

	return NODE('obj', { value: map }, loc);
}

/**
 * ```abnf
 * Array = "[" [Expr *(("," / SPACE) Expr) [","]] "]"
 * ```
*/
function parseArray(s: ITokenStream, isStatic: boolean): Ast.Node {
	const loc = s.token.loc;

	s.nextWith(TokenKind.OpenBracket);

	if (s.kind === TokenKind.NewLine) {
		s.next();
	}

	const value = [];
	while (s.kind !== TokenKind.CloseBracket) {
		value.push(parseExpr(s, isStatic));

		// separator
		if ((s.kind as TokenKind) === TokenKind.CloseBracket) {
			break;
		} else if (s.kind === TokenKind.Comma) {
			s.next();
		} else if (s.kind === TokenKind.NewLine) {
			// noop
		} else {
			if (!s.token.hasLeftSpacing) {
				throw new AiScriptSyntaxError('separator expected');
			}
		}

		if (s.kind === TokenKind.NewLine) {
			s.next();
		}
	}

	s.nextWith(TokenKind.CloseBracket);

	return NODE('arr', { value }, loc);
}

//#region Pratt parsing

type PrefixInfo = { opKind: 'prefix', kind: TokenKind, bp: number };
type InfixInfo = { opKind: 'infix', kind: TokenKind, lbp: number, rbp: number };
type PostfixInfo = { opKind: 'postfix', kind: TokenKind, bp: number };
type OpInfo = PrefixInfo | InfixInfo | PostfixInfo;

function parsePratt(s: ITokenStream, minBp: number): Ast.Node {
	// pratt parsing
	// https://matklad.github.io/2020/04/13/simple-but-powerful-pratt-parsing.html

	let left: Ast.Node;

	const tokenKind = s.kind;
	const prefix = operators.find((x): x is PrefixInfo => x.opKind === 'prefix' && x.kind === tokenKind);
	if (prefix != null) {
		left = parsePrefix(s, prefix.bp);
	} else {
		left = parseAtom(s, false);
	}

	while (true) {
		// 改行のエスケープ
		if (s.kind === TokenKind.BackSlash) {
			s.next();
			s.nextWith(TokenKind.NewLine);
		}

		const tokenKind = s.kind;

		const postfix = operators.find((x): x is PostfixInfo => x.opKind === 'postfix' && x.kind === tokenKind);
		if (postfix != null) {
			if (postfix.bp < minBp) {
				break;
			}

			if ([TokenKind.OpenBracket, TokenKind.OpenParen].includes(tokenKind) && s.token.hasLeftSpacing) {
				// 前にスペースがある場合は後置演算子として処理しない
			} else {
				left = parsePostfix(s, left);
				continue;
			}
		}

		const infix = operators.find((x): x is InfixInfo => x.opKind === 'infix' && x.kind === tokenKind);
		if (infix != null) {
			if (infix.lbp < minBp) {
				break;
			}

			left = parseInfix(s, left, infix.rbp);
			continue;
		}

		break;
	}

	return left;
}

//#endregion Pratt parsing
