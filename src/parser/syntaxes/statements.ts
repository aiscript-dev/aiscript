import { AiScriptSyntaxError } from '../../error.js';
import { CALL_NODE, NODE, unexpectedTokenError } from '../utils.js';
import { TokenKind } from '../token.js';
import { parseBlock, parseDest, parseParams, parseType } from './common.js';
import { parseExpr } from './expressions.js';

import type * as Ast from '../../node.js';
import type { ITokenStream } from '../streams/token-stream.js';

export function parseStatement(s: ITokenStream): Ast.Statement | Ast.Expression {
	switch (s.getTokenKind()) {
		case TokenKind.VarKeyword:
		case TokenKind.LetKeyword: {
			return parseVarDef(s);
		}
		case TokenKind.At: {
			// 識別子が続く場合はFnDef、そうでなければFnExpr
			if (s.lookahead(1).kind === TokenKind.Identifier) {
				return parseFnDef(s);
			}
			break;
		}
		case TokenKind.Out: {
			return parseOut(s);
		}
		case TokenKind.OpenSharpBracket: {
			return parseStatementWithAttr(s);
		}
	}
	const expr = parseExpr(s, false);
	const assign = tryParseAssign(s, expr);
	if (assign) {
		return assign;
	}
	return expr;
}

/**
 * ```abnf
 * DefStatement = VarDef / FnDef
 * ```
*/
export function parseDefStatement(s: ITokenStream): Ast.Definition {
	switch (s.getTokenKind()) {
		case TokenKind.VarKeyword:
		case TokenKind.LetKeyword: {
			return parseVarDef(s);
		}
		case TokenKind.At: {
			return parseFnDef(s);
		}
		default: {
			throw unexpectedTokenError(s.getTokenKind(), s.getPos());
		}
	}
}

/**
 * ```abnf
 * VarDef = ("let" / "var") Dest [":" Type] "=" Expr
 * ```
*/
function parseVarDef(s: ITokenStream): Ast.Definition {
	const startPos = s.getPos();

	let mut: boolean;
	switch (s.getTokenKind()) {
		case TokenKind.LetKeyword: {
			mut = false;
			break;
		}
		case TokenKind.VarKeyword: {
			mut = true;
			break;
		}
		default: {
			throw unexpectedTokenError(s.getTokenKind(), s.getPos());
		}
	}
	s.next();

	const dest = parseDest(s);

	let type: Ast.TypeSource | undefined;
	if (s.is(TokenKind.Colon)) {
		s.next();
		type = parseType(s);
	}

	s.expect(TokenKind.Eq);
	s.next();

	if (s.is(TokenKind.NewLine)) {
		s.next();
	}

	const expr = parseExpr(s, false);

	return NODE('def', { dest, varType: type, expr, mut, attr: [] }, startPos, s.getPos());
}

/**
 * ```abnf
 * FnDef = "@" IDENT Params [":" Type] Block
 * ```
*/
function parseFnDef(s: ITokenStream): Ast.Definition {
	const startPos = s.getPos();

	s.expect(TokenKind.At);
	s.next();

	s.expect(TokenKind.Identifier);
	const nameStartPos = s.getPos();
	const name = s.getTokenValue();
	s.next();
	const dest = NODE('identifier', { name }, nameStartPos, s.getPos());

	const params = parseParams(s);

	let type: Ast.TypeSource | undefined;
	if (s.is(TokenKind.Colon)) {
		s.next();
		type = parseType(s);
	}

	const body = parseBlock(s);

	const endPos = s.getPos();

	return NODE('def', {
		dest,
		expr: NODE('fn', {
			params: params,
			retType: type,
			children: body,
		}, startPos, endPos),
		mut: false,
		attr: [],
	}, startPos, endPos);
}

/**
 * ```abnf
 * Out = "<:" Expr
 * ```
*/
function parseOut(s: ITokenStream): Ast.Call {
	const startPos = s.getPos();

	s.expect(TokenKind.Out);
	s.next();
	const expr = parseExpr(s, false);

	return CALL_NODE('print', [expr], startPos, s.getPos());
}

/**
 * ```abnf
 * StatementWithAttr = *Attr Statement
 * ```
*/
function parseStatementWithAttr(s: ITokenStream): Ast.Definition {
	const attrs: Ast.Attribute[] = [];
	while (s.is(TokenKind.OpenSharpBracket)) {
		attrs.push(parseAttr(s) as Ast.Attribute);
		s.expect(TokenKind.NewLine);
		s.next();
	}

	const statement = parseStatement(s);

	if (statement.type !== 'def') {
		throw new AiScriptSyntaxError('invalid attribute.', statement.loc.start);
	}
	if (statement.attr != null) {
		statement.attr.push(...attrs);
	} else {
		statement.attr = attrs;
	}

	return statement;
}

/**
 * ```abnf
 * Attr = "#[" IDENT [StaticExpr] "]"
 * ```
*/
function parseAttr(s: ITokenStream): Ast.Attribute {
	const startPos = s.getPos();

	s.expect(TokenKind.OpenSharpBracket);
	s.next();

	s.expect(TokenKind.Identifier);
	const name = s.getTokenValue();
	s.next();

	let value: Ast.Expression;
	if (!s.is(TokenKind.CloseBracket)) {
		value = parseExpr(s, true);
	} else {
		const closePos = s.getPos();
		value = NODE('bool', { value: true }, closePos, closePos);
	}

	s.expect(TokenKind.CloseBracket);
	s.next();

	return NODE('attr', { name, value }, startPos, s.getPos());
}

/**
 * ```abnf
 * Assign = Expr ("=" / "+=" / "-=") Expr
 * ```
*/
function tryParseAssign(s: ITokenStream, dest: Ast.Expression): Ast.Statement | undefined {
	const startPos = s.getPos();

	// Assign
	switch (s.getTokenKind()) {
		case TokenKind.Eq: {
			s.next();
			const expr = parseExpr(s, false);
			return NODE('assign', { dest, expr }, startPos, s.getPos());
		}
		case TokenKind.PlusEq: {
			s.next();
			const expr = parseExpr(s, false);
			return NODE('addAssign', { dest, expr }, startPos, s.getPos());
		}
		case TokenKind.MinusEq: {
			s.next();
			const expr = parseExpr(s, false);
			return NODE('subAssign', { dest, expr }, startPos, s.getPos());
		}
		default: {
			return;
		}
	}
}
