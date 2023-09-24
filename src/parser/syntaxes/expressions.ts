import { AiScriptSyntaxError } from '../../error.js';
import { TokenKind } from '../token.js';
import { TokenStream } from '../streams/token-stream.js';
import type { ITokenStream } from '../streams/token-stream.js';
import { NODE } from '../node.js';
import type * as Cst from '../node.js';

import { parseBlockOrStatement } from './statements.js';
import { parseBlock } from './common.js';
import { parseFnExpr } from './function.js';

export function parseExpr(s: ITokenStream): Cst.Node {
	// TODO: Pratt parsing

	// prefix: not
	// prefix: sign
	// infix
	// call chain
	// prop chain
	// index chain

	switch (s.kind) {
		case TokenKind.IfKeyword: {
			return parseIf(s);
		}
		case TokenKind.OpenAtParen: {
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
		default: {
			throw new Error('todo');
		}
	}
}

/**
 * ```abnf
 * If = "if" Expr BlockOrStatement *("elif" Expr BlockOrStatement) ["else" BlockOrStatement]
 * ```
*/
export function parseIf(s: ITokenStream): Cst.Node {
	s.nextWith(TokenKind.IfKeyword);
	const cond = parseExpr(s);
	const then = parseBlockOrStatement(s);

	const elseif: { cond: any, then: any }[] = [];
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

export function parseMatch(s: ITokenStream): Cst.Node {
	throw new Error('todo');
}

/**
 * ```abnf
 * Eval = "eval" Block
 * ```
*/
export function parseEval(s: ITokenStream): Cst.Node {
	s.nextWith(TokenKind.EvalKeyword);
	const statements = parseBlock(s);
	return NODE('block', { statements });
}

/**
 * ```abnf
 * Exists = "exists" Reference
 * ```
*/
export function parseExists(s: ITokenStream): Cst.Node {
	s.nextWith(TokenKind.ExistsKeyword);
	const identifier = parseReference(s);
	return NODE('exists', { identifier });
}

/**
 * ```abnf
 * Reference = IDENT *(":" IDENT)
 * ```
*/
export function parseReference(s: ITokenStream): Cst.Node {
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

export function parseObject(s: ITokenStream): Cst.Node {
	throw new Error('todo');
}

/**
 * ```abnf
 * Array = "[" *(Expr [","]) "]"
 * ```
*/
export function parseArray(s: ITokenStream): Cst.Node {
	s.nextWith(TokenKind.OpenBracket);

	const value = [];
	while (s.kind !== TokenKind.CloseBracket) {
		value.push(parseExpr(s));
		if (s.kind === TokenKind.Comma) {
			s.next();
		}
	}

	s.nextWith(TokenKind.CloseBracket);

	return NODE('arr', { value });
}
