import { AiScriptSyntaxError } from '../../error.js';
import { CALL_NODE, NODE } from '../node.js';
import { TokenStream } from '../streams/token-stream.js';
import { TokenKind } from '../token.js';
import { parseBlock, parseParams } from './common.js';
import { parseBlockOrStatement } from './statements.js';

import type * as Cst from '../node.js';
import type { ITokenStream } from '../streams/token-stream.js';

export function parseExpr(s: ITokenStream): Cst.Node {
	return parsePratt(s, 0);
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

function parsePrefix(s: ITokenStream, minBp: number): Cst.Node {
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
				return expr;
			} else {
				throw new AiScriptSyntaxError('currently, sign is only supported for number literal.');
			}
			// TODO: 将来的にサポートされる式を拡張
			// return NODE('plus', { expr });
		}
		case TokenKind.Minus: {
			// 数値リテラル以外は非サポート
			if (expr.type === 'num') {
				return NODE('num', { value: -1 * expr.value });
			} else {
				throw new AiScriptSyntaxError('currently, sign is only supported for number literal.');
			}
			// TODO: 将来的にサポートされる式を拡張
			// return NODE('minus', { expr });
		}
		case TokenKind.Not: {
			return NODE('not', { expr });
		}
		default: {
			throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[op]}`);
		}
	}
}

function parseInfix(s: ITokenStream, left: Cst.Node, minBp: number): Cst.Node {
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
		});
	} else {
		const right = parsePratt(s, minBp);

		switch (op) {
			case TokenKind.Hat: {
				return CALL_NODE('Core:pow', [left, right]);
			}
			case TokenKind.Asterisk: {
				return CALL_NODE('Core:mul', [left, right]);
			}
			case TokenKind.Slash: {
				return CALL_NODE('Core:div', [left, right]);
			}
			case TokenKind.Percent: {
				return CALL_NODE('Core:mod', [left, right]);
			}
			case TokenKind.Plus: {
				return CALL_NODE('Core:add', [left, right]);
			}
			case TokenKind.Minus: {
				return CALL_NODE('Core:sub', [left, right]);
			}
			case TokenKind.Lt: {
				return CALL_NODE('Core:lt', [left, right]);
			}
			case TokenKind.LtEq: {
				return CALL_NODE('Core:lteq', [left, right]);
			}
			case TokenKind.Gt: {
				return CALL_NODE('Core:gt', [left, right]);
			}
			case TokenKind.GtEq: {
				return CALL_NODE('Core:gteq', [left, right]);
			}
			case TokenKind.Eq2: {
				return CALL_NODE('Core:eq', [left, right]);
			}
			case TokenKind.NotEq: {
				return CALL_NODE('Core:neq', [left, right]);
			}
			case TokenKind.And2: {
				return NODE('and', { left, right });
			}
			case TokenKind.Or2: {
				return NODE('or', { left, right });
			}
			default: {
				throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[op]}`);
			}
		}
	}
}

function parsePostfix(s: ITokenStream, expr: Cst.Node): Cst.Node {
	const op = s.kind;
	switch (op) {
		case TokenKind.OpenParen: {
			return parseCall(s, expr);
		}
		case TokenKind.OpenBracket: {
			s.next();
			const index = parseExpr(s);
			s.nextWith(TokenKind.CloseBracket);

			return NODE('index', {
				target: expr,
				index,
			});
		}
		default: {
			throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[op]}`);
		}
	}
}

function parseAtom(s: ITokenStream): Cst.Node {
	switch (s.kind) {
		case TokenKind.IfKeyword: {
			return parseIf(s);
		}
		case TokenKind.At: {
			return parseFnExpr(s);
		}
		case TokenKind.MatchKeyword: {
			return parseMatch(s);
		}
		case TokenKind.EvalKeyword: {
			return parseEval(s);
		}
		case TokenKind.ExistsKeyword: {
			return parseExists(s);
		}
		case TokenKind.Template: {
			const values: (string | Cst.Node)[] = [];

			for (const element of s.token.children!) {
				switch (element.kind) {
					case TokenKind.TemplateStringElement: {
						values.push(NODE('str', { value: element.value! }));
						break;
					}
					case TokenKind.TemplateExprElement: {
						// スキャナで埋め込み式として事前に読み取っておいたトークン列をパースする
						const exprStream = new TokenStream(element.children!);
						exprStream.init();
						const expr = parseExpr(exprStream);
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
			return NODE('tmpl', { tmpl: values });
		}
		case TokenKind.StringLiteral: {
			const value = s.token.value!;
			s.next();
			return NODE('str', { value });
		}
		case TokenKind.NumberLiteral: {
			// TODO: validate number value
			const value = Number(s.token.value!);
			s.next();
			return NODE('num', { value });
		}
		case TokenKind.TrueKeyword:
		case TokenKind.FalseKeyword: {
			const value = (s.kind === TokenKind.TrueKeyword);
			s.next();
			return NODE('bool', { value });
		}
		case TokenKind.NullKeyword: {
			s.next();
			return NODE('null', { });
		}
		case TokenKind.OpenBrace: {
			return parseObject(s);
		}
		case TokenKind.OpenBracket: {
			return parseArray(s);
		}
		case TokenKind.Identifier: {
			return parseReference(s);
		}
		case TokenKind.OpenParen: {
			s.next();
			const expr = parseExpr(s);
			s.nextWith(TokenKind.CloseParen);
			return expr;
		}
		default: {
			throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[s.kind]}`);
		}
	}
}

/**
 * Call = "(" [Expr *(("," / SPACE) Expr)] ")"
*/
function parseCall(s: ITokenStream, target: Cst.Node): Cst.Node {
	const items: Cst.Node[] = [];

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

		items.push(parseExpr(s));
	}

	s.nextWith(TokenKind.CloseParen);

	return NODE('call', {
		target,
		args: items,
	});
}

/**
 * ```abnf
 * If = "if" Expr BlockOrStatement *("elif" Expr BlockOrStatement) ["else" BlockOrStatement]
 * ```
*/
function parseIf(s: ITokenStream): Cst.Node {
	s.nextWith(TokenKind.IfKeyword);
	const cond = parseExpr(s);
	const then = parseBlockOrStatement(s);

	const elseif: { cond: Cst.Node, then: Cst.Node }[] = [];
	while (s.kind === TokenKind.ElifKeyword) {
		s.next();
		const elifCond = parseExpr(s);
		const elifThen = parseBlockOrStatement(s);
		elseif.push({ cond: elifCond, then: elifThen });
	}

	let _else = undefined;
	if (s.kind === TokenKind.ElseKeyword) {
		s.next();
		_else = parseBlockOrStatement(s);
	}

	return NODE('if', { cond, then, elseif, else: _else });
}

/**
 * ```abnf
 * FnExpr = "@" Params [":" Type] Block
 * ```
*/
function parseFnExpr(s: ITokenStream): Cst.Node {
	s.nextWith(TokenKind.At);

	const params = parseParams(s);

	// type

	const body = parseBlock(s);

	return NODE('fn', { args: params, retType: undefined, children: body });
}

/**
 * ```abnf
 * Match = "match" Expr "{" *("case" Expr "=>" BlockOrStatement) ["default" "=>" BlockOrStatement] "}"
 * ```
*/
function parseMatch(s: ITokenStream): Cst.Node {
	s.nextWith(TokenKind.MatchKeyword);
	const about = parseExpr(s);

	s.nextWith(TokenKind.OpenBrace);
	s.nextWith(TokenKind.NewLine);

	const qs: { q: Cst.Node, a: Cst.Node }[] = [];
	while (s.kind !== TokenKind.DefaultKeyword && s.kind !== TokenKind.CloseBrace) {
		s.nextWith(TokenKind.CaseKeyword);
		const q = parseExpr(s);
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

	return NODE('match', { about, qs, default: x });
}

/**
 * ```abnf
 * Eval = "eval" Block
 * ```
*/
function parseEval(s: ITokenStream): Cst.Node {
	s.nextWith(TokenKind.EvalKeyword);
	const statements = parseBlock(s);
	return NODE('block', { statements });
}

/**
 * ```abnf
 * Exists = "exists" Reference
 * ```
*/
function parseExists(s: ITokenStream): Cst.Node {
	s.nextWith(TokenKind.ExistsKeyword);
	const identifier = parseReference(s);
	return NODE('exists', { identifier });
}

/**
 * ```abnf
 * Reference = IDENT *(":" IDENT)
 * ```
*/
function parseReference(s: ITokenStream): Cst.Node {
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
	return NODE('identifier', { name: segs.join(':') });
}

/**
 * ```abnf
 * Object = "{" [IDENT ":" Expr *(("," / ";" / SPACE) IDENT ":" Expr) ["," / ";"]] "}"
 * ```
*/
function parseObject(s: ITokenStream): Cst.Node {
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

		const v = parseExpr(s);

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

	return NODE('obj', { value: map });
}

/**
 * ```abnf
 * Array = "[" [Expr *(("," / SPACE) Expr) [","]] "]"
 * ```
*/
function parseArray(s: ITokenStream): Cst.Node {
	s.nextWith(TokenKind.OpenBracket);

	if (s.kind === TokenKind.NewLine) {
		s.next();
	}

	const value = [];
	while (s.kind !== TokenKind.CloseBracket) {
		value.push(parseExpr(s));

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

	return NODE('arr', { value });
}

//#region Pratt parsing

type PrefixInfo = { opKind: 'prefix', kind: TokenKind, bp: number };
type InfixInfo = { opKind: 'infix', kind: TokenKind, lbp: number, rbp: number };
type PostfixInfo = { opKind: 'postfix', kind: TokenKind, bp: number };
type OpInfo = PrefixInfo | InfixInfo | PostfixInfo;

function parsePratt(s: ITokenStream, minBp: number): Cst.Node {
	// pratt parsing
	// https://matklad.github.io/2020/04/13/simple-but-powerful-pratt-parsing.html

	let left: Cst.Node;

	const tokenKind = s.kind;
	const prefix = operators.find((x): x is PrefixInfo => x.opKind === 'prefix' && x.kind === tokenKind);
	if (prefix != null) {
		left = parsePrefix(s, prefix.bp);
	} else {
		left = parseAtom(s);
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

			left = parsePostfix(s, left);
			continue;
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
