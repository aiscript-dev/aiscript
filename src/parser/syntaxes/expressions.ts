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
	const startPos = s.getPos();
	const op = s.getKind();
	s.next();

	// 改行のエスケープ
	if (s.getKind() === TokenKind.BackSlash) {
		s.next();
		s.nextWith(TokenKind.NewLine);
	}

	const expr = parsePratt(s, minBp);

	const endPos = expr.loc.end;

	switch (op) {
		case TokenKind.Plus: {
			// 数値リテラル以外は非サポート
			if (expr.type === 'num') {
				return NODE('num', { value: expr.value }, startPos, endPos);
			} else {
				throw new AiScriptSyntaxError('currently, sign is only supported for number literal.', startPos);
			}
			// TODO: 将来的にサポートされる式を拡張
			// return NODE('plus', { expr }, startPos, endPos);
		}
		case TokenKind.Minus: {
			// 数値リテラル以外は非サポート
			if (expr.type === 'num') {
				return NODE('num', { value: -1 * expr.value }, startPos, endPos);
			} else {
				throw new AiScriptSyntaxError('currently, sign is only supported for number literal.', startPos);
			}
			// TODO: 将来的にサポートされる式を拡張
			// return NODE('minus', { expr }, startPos, endPos);
		}
		case TokenKind.Not: {
			return NODE('not', { expr }, startPos, endPos);
		}
		default: {
			throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[op]}`, startPos);
		}
	}
}

function parseInfix(s: ITokenStream, left: Ast.Node, minBp: number): Ast.Node {
	const startPos = s.getPos();
	const op = s.getKind();
	s.next();

	// 改行のエスケープ
	if (s.getKind() === TokenKind.BackSlash) {
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
		}, startPos, s.getPos());
	} else {
		const right = parsePratt(s, minBp);
		const endPos = s.getPos();

		switch (op) {
			case TokenKind.Hat: {
				return CALL_NODE('Core:pow', [left, right], startPos, endPos);
			}
			case TokenKind.Asterisk: {
				return CALL_NODE('Core:mul', [left, right], startPos, endPos);
			}
			case TokenKind.Slash: {
				return CALL_NODE('Core:div', [left, right], startPos, endPos);
			}
			case TokenKind.Percent: {
				return CALL_NODE('Core:mod', [left, right], startPos, endPos);
			}
			case TokenKind.Plus: {
				return CALL_NODE('Core:add', [left, right], startPos, endPos);
			}
			case TokenKind.Minus: {
				return CALL_NODE('Core:sub', [left, right], startPos, endPos);
			}
			case TokenKind.Lt: {
				return CALL_NODE('Core:lt', [left, right], startPos, endPos);
			}
			case TokenKind.LtEq: {
				return CALL_NODE('Core:lteq', [left, right], startPos, endPos);
			}
			case TokenKind.Gt: {
				return CALL_NODE('Core:gt', [left, right], startPos, endPos);
			}
			case TokenKind.GtEq: {
				return CALL_NODE('Core:gteq', [left, right], startPos, endPos);
			}
			case TokenKind.Eq2: {
				return CALL_NODE('Core:eq', [left, right], startPos, endPos);
			}
			case TokenKind.NotEq: {
				return CALL_NODE('Core:neq', [left, right], startPos, endPos);
			}
			case TokenKind.And2: {
				return NODE('and', { left, right }, startPos, endPos);
			}
			case TokenKind.Or2: {
				return NODE('or', { left, right }, startPos, endPos);
			}
			default: {
				throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[op]}`, startPos);
			}
		}
	}
}

function parsePostfix(s: ITokenStream, expr: Ast.Node): Ast.Node {
	const startPos = s.getPos();
	const op = s.getKind();

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
			}, startPos, s.getPos());
		}
		default: {
			throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[op]}`, startPos);
		}
	}
}

function parseAtom(s: ITokenStream, isStatic: boolean): Ast.Node {
	const startPos = s.getPos();

	switch (s.getKind()) {
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

			for (const [i, element] of s.token.children!.entries()) {
				switch (element.kind) {
					case TokenKind.TemplateStringElement: {
						// トークンの終了位置を取得するために先読み
						const nextToken = s.token.children![i + 1] ?? s.lookahead(1);
						values.push(NODE('str', { value: element.value! }, element.pos, nextToken.pos));
						break;
					}
					case TokenKind.TemplateExprElement: {
						// スキャナで埋め込み式として事前に読み取っておいたトークン列をパースする
						const exprStream = new TokenStream(element.children!);
						const expr = parseExpr(exprStream, false);
						if (exprStream.getKind() !== TokenKind.EOF) {
							throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[exprStream.token.kind]}`, exprStream.token.pos);
						}
						values.push(expr);
						break;
					}
					default: {
						throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[element.kind]}`, element.pos);
					}
				}
			}

			s.next();
			return NODE('tmpl', { tmpl: values }, startPos, s.getPos());
		}
		case TokenKind.StringLiteral: {
			const value = s.token.value!;
			s.next();
			return NODE('str', { value }, startPos, s.getPos());
		}
		case TokenKind.NumberLiteral: {
			// TODO: validate number value
			const value = Number(s.token.value!);
			s.next();
			return NODE('num', { value }, startPos, s.getPos());
		}
		case TokenKind.TrueKeyword:
		case TokenKind.FalseKeyword: {
			const value = (s.getKind() === TokenKind.TrueKeyword);
			s.next();
			return NODE('bool', { value }, startPos, s.getPos());
		}
		case TokenKind.NullKeyword: {
			s.next();
			return NODE('null', {}, startPos, s.getPos());
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
	throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[s.getKind()]}`, startPos);
}

/**
 * Call = "(" [Expr *(SEP Expr) [SEP]] ")"
*/
function parseCall(s: ITokenStream, target: Ast.Node): Ast.Node {
	const startPos = s.getPos();
	const items: Ast.Node[] = [];

	s.nextWith(TokenKind.OpenParen);

	if (s.getKind() === TokenKind.NewLine) {
		s.next();
	}

	while (s.getKind() !== TokenKind.CloseParen) {
		items.push(parseExpr(s, false));

		// separator
		switch (s.getKind()) {
			case TokenKind.NewLine: {
				s.next();
				break;
			}
			case TokenKind.Comma: {
				s.next();
				if (s.getKind() === TokenKind.NewLine) {
					s.next();
				}
				break;
			}
			case TokenKind.CloseParen: {
				break;
			}
			default: {
				throw new AiScriptSyntaxError('separator expected', s.getPos());
			}
		}
	}

	s.nextWith(TokenKind.CloseParen);

	return NODE('call', {
		target,
		args: items,
	}, startPos, s.getPos());
}

/**
 * ```abnf
 * If = "if" Expr BlockOrStatement *("elif" Expr BlockOrStatement) ["else" BlockOrStatement]
 * ```
*/
function parseIf(s: ITokenStream): Ast.Node {
	const startPos = s.getPos();

	s.nextWith(TokenKind.IfKeyword);
	const cond = parseExpr(s, false);
	const then = parseBlockOrStatement(s);

	if (s.getKind() === TokenKind.NewLine && [TokenKind.ElifKeyword, TokenKind.ElseKeyword].includes(s.lookahead(1).kind)) {
		s.next();
	}

	const elseif: { cond: Ast.Node, then: Ast.Node }[] = [];
	while (s.getKind() === TokenKind.ElifKeyword) {
		s.next();
		const elifCond = parseExpr(s, false);
		const elifThen = parseBlockOrStatement(s);
		if ((s.getKind()) === TokenKind.NewLine && [TokenKind.ElifKeyword, TokenKind.ElseKeyword].includes(s.lookahead(1).kind)) {
			s.next();
		}
		elseif.push({ cond: elifCond, then: elifThen });
	}

	let _else = undefined;
	if (s.getKind() === TokenKind.ElseKeyword) {
		s.next();
		_else = parseBlockOrStatement(s);
	}

	return NODE('if', { cond, then, elseif, else: _else }, startPos, s.getPos());
}

/**
 * ```abnf
 * FnExpr = "@" Params [":" Type] Block
 * ```
*/
function parseFnExpr(s: ITokenStream): Ast.Node {
	const startPos = s.getPos();

	s.nextWith(TokenKind.At);

	const params = parseParams(s);

	let type;
	if ((s.getKind()) === TokenKind.Colon) {
		s.next();
		type = parseType(s);
	}

	const body = parseBlock(s);

	return NODE('fn', { args: params, retType: type, children: body }, startPos, s.getPos());
}

/**
 * ```abnf
 * Match = "match" Expr "{" [MatchCases] ["default" "=>" BlockOrStatement [SEP]] "}"
 * MatchCases = "case" Expr "=>" BlockOrStatement *(SEP "case" Expr "=>" BlockOrStatement) [SEP]
 * ```
*/
function parseMatch(s: ITokenStream): Ast.Node {
	const startPos = s.getPos();

	s.nextWith(TokenKind.MatchKeyword);
	const about = parseExpr(s, false);

	s.nextWith(TokenKind.OpenBrace);

	if (s.getKind() === TokenKind.NewLine) {
		s.next();
	}

	const qs: { q: Ast.Node, a: Ast.Node }[] = [];
	while (s.getKind() !== TokenKind.DefaultKeyword && s.getKind() !== TokenKind.CloseBrace) {
		s.nextWith(TokenKind.CaseKeyword);
		const q = parseExpr(s, false);
		s.nextWith(TokenKind.Arrow);
		const a = parseBlockOrStatement(s);
		qs.push({ q, a });

		// separator
		switch (s.getKind()) {
			case TokenKind.NewLine: {
				s.next();
				break;
			}
			case TokenKind.Comma: {
				s.next();
				if (s.getKind() === TokenKind.NewLine) {
					s.next();
				}
				break;
			}
			case TokenKind.DefaultKeyword:
			case TokenKind.CloseBrace: {
				break;
			}
			default: {
				throw new AiScriptSyntaxError('separator expected', s.getPos());
			}
		}
	}

	let x;
	if (s.getKind() === TokenKind.DefaultKeyword) {
		s.next();
		s.nextWith(TokenKind.Arrow);
		x = parseBlockOrStatement(s);

		// separator
		switch (s.getKind()) {
			case TokenKind.NewLine: {
				s.next();
				break;
			}
			case TokenKind.Comma: {
				s.next();
				if ((s.getKind()) === TokenKind.NewLine) {
					s.next();
				}
				break;
			}
			case TokenKind.CloseBrace: {
				break;
			}
			default: {
				throw new AiScriptSyntaxError('separator expected', s.getPos());
			}
		}
	}

	s.nextWith(TokenKind.CloseBrace);

	return NODE('match', { about, qs, default: x }, startPos, s.getPos());
}

/**
 * ```abnf
 * Eval = "eval" Block
 * ```
*/
function parseEval(s: ITokenStream): Ast.Node {
	const startPos = s.getPos();

	s.nextWith(TokenKind.EvalKeyword);
	const statements = parseBlock(s);

	return NODE('block', { statements }, startPos, s.getPos());
}

/**
 * ```abnf
 * Exists = "exists" Reference
 * ```
*/
function parseExists(s: ITokenStream): Ast.Node {
	const startPos = s.getPos();

	s.nextWith(TokenKind.ExistsKeyword);
	const identifier = parseReference(s);

	return NODE('exists', { identifier }, startPos, s.getPos());
}

/**
 * ```abnf
 * Reference = IDENT *(":" IDENT)
 * ```
*/
function parseReference(s: ITokenStream): Ast.Node {
	const startPos = s.getPos();

	const segs: string[] = [];
	while (true) {
		if (segs.length > 0) {
			if (s.getKind() === TokenKind.Colon) {
				if (s.token.hasLeftSpacing) {
					throw new AiScriptSyntaxError('Cannot use spaces in a reference.', s.getPos());
				}
				s.next();
				if (s.token.hasLeftSpacing) {
					throw new AiScriptSyntaxError('Cannot use spaces in a reference.', s.getPos());
				}
			} else {
				break;
			}
		}
		s.expect(TokenKind.Identifier);
		segs.push(s.token.value!);
		s.next();
	}
	return NODE('identifier', { name: segs.join(':') }, startPos, s.getPos());
}

/**
 * ```abnf
 * Object = "{" [IDENT ":" Expr *(SEP IDENT ":" Expr) [SEP]] "}"
 * ```
*/
function parseObject(s: ITokenStream, isStatic: boolean): Ast.Node {
	const startPos = s.getPos();

	s.nextWith(TokenKind.OpenBrace);

	while (s.getKind() === TokenKind.NewLine) {
		s.next();
	}

	const map = new Map();
	while (s.getKind() !== TokenKind.CloseBrace) {
		s.expect(TokenKind.Identifier);
		const k = s.token.value!;
		s.next();

		s.nextWith(TokenKind.Colon);

		const v = parseExpr(s, isStatic);

		map.set(k, v);

		// separator
		switch (s.getKind()) {
			case TokenKind.NewLine:
			case TokenKind.Comma: {
				s.next();
				while (s.getKind() === TokenKind.NewLine) {
					s.next();
				}
				break;
			}
			case TokenKind.CloseBrace: {
				break;
			}
			default: {
				throw new AiScriptSyntaxError('separator expected', s.getPos());
			}
		}
	}

	s.nextWith(TokenKind.CloseBrace);

	return NODE('obj', { value: map }, startPos, s.getPos());
}

/**
 * ```abnf
 * Array = "[" [Expr *(SEP Expr) [SEP]] "]"
 * ```
*/
function parseArray(s: ITokenStream, isStatic: boolean): Ast.Node {
	const startPos = s.getPos();

	s.nextWith(TokenKind.OpenBracket);

	while (s.getKind() === TokenKind.NewLine) {
		s.next();
	}

	const value = [];
	while (s.getKind() !== TokenKind.CloseBracket) {
		value.push(parseExpr(s, isStatic));

		// separator
		switch (s.getKind()) {
			case TokenKind.NewLine:
			case TokenKind.Comma: {
				s.next();
				while (s.getKind() === TokenKind.NewLine) {
					s.next();
				}
				break;
			}
			case TokenKind.CloseBracket: {
				break;
			}
			default: {
				throw new AiScriptSyntaxError('separator expected', s.getPos());
			}
		}
	}

	s.nextWith(TokenKind.CloseBracket);

	return NODE('arr', { value }, startPos, s.getPos());
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

	const tokenKind = s.getKind();
	const prefix = operators.find((x): x is PrefixInfo => x.opKind === 'prefix' && x.kind === tokenKind);
	if (prefix != null) {
		left = parsePrefix(s, prefix.bp);
	} else {
		left = parseAtom(s, false);
	}

	while (true) {
		// 改行のエスケープ
		if (s.getKind() === TokenKind.BackSlash) {
			s.next();
			s.nextWith(TokenKind.NewLine);
		}

		const tokenKind = s.getKind();

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
