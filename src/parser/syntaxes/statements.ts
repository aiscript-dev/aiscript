import { AiScriptSyntaxError } from '../../error.js';
import { CALL_NODE, LOC, NODE, unexpectedTokenError } from '../utils.js';
import { expectTokenKind, TokenKind } from '../token.js';
import { parseBlock, parseDest, parseLabel, parseParams } from './common.js';
import { parseExpr } from './expressions.js';
import { parseType, parseTypeParams } from './types.js';

import type * as Ast from '../../node.js';
import type { ITokenStream } from '../streams/token-stream.js';

export function parseStatement(s: ITokenStream): Ast.Statement | Ast.Expression {
	const startPos = s.getPos();

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
		case TokenKind.ReturnKeyword: {
			return parseReturn(s);
		}
		case TokenKind.OpenSharpBracket: {
			return parseStatementWithAttr(s);
		}
		case TokenKind.Sharp: {
			return parseStatementWithLabel(s);
		}
		case TokenKind.EachKeyword: {
			return parseEach(s);
		}
		case TokenKind.ForKeyword: {
			return parseFor(s);
		}
		case TokenKind.LoopKeyword: {
			return parseLoop(s);
		}
		case TokenKind.DoKeyword: {
			return parseDoWhile(s);
		}
		case TokenKind.WhileKeyword: {
			return parseWhile(s);
		}
		case TokenKind.BreakKeyword: {
			return parseBreak(s);
		}
		case TokenKind.ContinueKeyword: {
			return parseContinue(s);
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
 * BlockOrStatement = Block / Statement
 * ```
*/
export function parseBlockOrStatement(s: ITokenStream): Ast.Statement | Ast.Expression {
	if (s.is(TokenKind.OpenBrace)) {
		const startPos = s.getPos();
		const statements = parseBlock(s);
		return NODE('block', { statements }, startPos, s.getPos());
	} else {
		return parseStatement(s);
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
 * FnDef = "@" IDENT [TypeParams] Params [":" Type] Block
 * ```
*/
function parseFnDef(s: ITokenStream): Ast.Definition {
	const startPos = s.getPos();

	s.expect(TokenKind.At);
	s.next();

	const token = s.getToken();
	expectTokenKind(token, TokenKind.Identifier);
	const nameStartPos = s.getPos();
	const name = token.value;
	s.next();
	const dest = NODE('identifier', { name }, nameStartPos, s.getPos());

	let typeParams: Ast.TypeParam[];
	if (s.is(TokenKind.Lt)) {
		typeParams = parseTypeParams(s);
	} else {
		typeParams = [];
	}

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
			typeParams,
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
 * StatementWithLabel = "#" IDENT ":" Statement
 * ```
*/
function parseStatementWithLabel(s: ITokenStream): Ast.Each | Ast.For | Ast.Loop | Ast.If | Ast.Match | Ast.Block {
	const label = parseLabel(s);
	s.expect(TokenKind.Colon);
	s.next();

	const statement = parseStatement(s);
	switch (statement.type) {
		case 'if':
		case 'match':
		case 'block':
		case 'each':
		case 'for':
		case 'loop': {
			statement.label = label;
			return statement;
		}
		default: {
			throw new AiScriptSyntaxError('cannot use label for statement other than eval / if / match / for / each / while / do-while / loop', statement.loc.start);
		}
	}
}

/**
 * ```abnf
 * Each = "each" "(" "let" Dest "," Expr ")" BlockOrStatement
 *      / "each"     "let" Dest "," Expr     BlockOrStatement
 * ```
*/
function parseEach(s: ITokenStream): Ast.Each {
	const startPos = s.getPos();
	let hasParen = false;

	s.expect(TokenKind.EachKeyword);
	s.next();

	if (s.is(TokenKind.OpenParen)) {
		hasParen = true;
		s.next();
	}

	s.expect(TokenKind.LetKeyword);
	s.next();

	const dest = parseDest(s);

	if (s.is(TokenKind.Comma)) {
		s.next();
	} else {
		throw new AiScriptSyntaxError('separator expected', s.getPos());
	}

	const items = parseExpr(s, false);

	if (hasParen) {
		s.expect(TokenKind.CloseParen);
		s.next();
	}

	const body = parseBlockOrStatement(s);

	return NODE('each', {
		var: dest,
		items: items,
		for: body,
	}, startPos, s.getPos());
}

/**
 * ```abnf
 * For = ForRange / ForTimes
 * ForRange = "for" "(" "let" IDENT ["=" Expr] "," Expr ")" BlockOrStatement
 *          / "for"     "let" IDENT ["=" Expr] "," Expr     BlockOrStatement
 * ForTimes = "for" "(" Expr ")" BlockOrStatement
 *          / "for"     Expr     BlockOrStatement
 * ```
*/
function parseFor(s: ITokenStream): Ast.For {
	const startPos = s.getPos();
	let hasParen = false;

	s.expect(TokenKind.ForKeyword);
	s.next();

	if (s.is(TokenKind.OpenParen)) {
		hasParen = true;
		s.next();
	}

	if (s.is(TokenKind.LetKeyword)) {
		// range syntax
		s.next();

		const identPos = s.getPos();

		const token = s.getToken();
		expectTokenKind(token, TokenKind.Identifier);
		const name = token.value;
		s.next();

		let _from: Ast.Expression;
		if (s.is(TokenKind.Eq)) {
			s.next();
			_from = parseExpr(s, false);
		} else {
			_from = NODE('num', { value: 0 }, identPos, identPos);
		}

		if (s.is(TokenKind.Comma)) {
			s.next();
		} else {
			throw new AiScriptSyntaxError('separator expected', s.getPos());
		}

		const to = parseExpr(s, false);

		if (hasParen) {
			s.expect(TokenKind.CloseParen);
			s.next();
		}

		const body = parseBlockOrStatement(s);

		return {
			type: 'for',
			var: name,
			from: _from,
			to,
			for: body,
			loc: LOC(startPos, s.getPos()),
		};
	} else {
		// times syntax

		const times = parseExpr(s, false);

		if (hasParen) {
			s.expect(TokenKind.CloseParen);
			s.next();
		}
	
		const body = parseBlockOrStatement(s);

		return {
			type: 'for',
			times,
			for: body,
			loc: LOC(startPos, s.getPos()),
		};
	}
}

/**
 * ```abnf
 * Return = "return" Expr
 * ```
*/
function parseReturn(s: ITokenStream): Ast.Return {
	const startPos = s.getPos();

	s.expect(TokenKind.ReturnKeyword);
	s.next();
	const expr = parseExpr(s, false);

	return NODE('return', { expr }, startPos, s.getPos());
}

/**
 * ```abnf
 * StatementWithAttr = *Attr Statement
 * ```
*/
export function parseStatementWithAttr(s: ITokenStream): Ast.Definition {
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

	const token = s.getToken();
	expectTokenKind(token, TokenKind.Identifier);
	const name = token.value;
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
 * Loop = "loop" Block
 * ```
*/
function parseLoop(s: ITokenStream): Ast.Loop {
	const startPos = s.getPos();

	s.expect(TokenKind.LoopKeyword);
	s.next();
	const statements = parseBlock(s);

	return NODE('loop', { statements }, startPos, s.getPos());
}

/**
 * ```abnf
 * Loop = "do" BlockOrStatement "while" Expr
 * ```
*/
function parseDoWhile(s: ITokenStream): Ast.Loop {
	const doStartPos = s.getPos();
	s.expect(TokenKind.DoKeyword);
	s.next();
	const body = parseBlockOrStatement(s);
	const whilePos = s.getPos();
	s.expect(TokenKind.WhileKeyword);
	s.next();
	const cond = parseExpr(s, false);
	const endPos = s.getPos();

	return NODE('loop', {
		statements: [
			body,
			NODE('if', {
				cond: NODE('not', { expr: cond }, whilePos, endPos),
				then: NODE('break', {}, endPos, endPos),
				elseif: [],
			}, whilePos, endPos),
		],
	}, doStartPos, endPos);
}

/**
 * ```abnf
 * Loop = "while" Expr BlockOrStatement
 * ```
*/
function parseWhile(s: ITokenStream): Ast.Loop {
	const startPos = s.getPos();
	s.expect(TokenKind.WhileKeyword);
	s.next();
	const cond = parseExpr(s, false);
	const condEndPos = s.getPos();
	const body = parseBlockOrStatement(s);

	return NODE('loop', {
		statements: [
			NODE('if', {
				cond: NODE('not', { expr: cond }, startPos, condEndPos),
				then: NODE('break', {}, condEndPos, condEndPos),
				elseif: [],
			}, startPos, condEndPos),
			body,
		],
	}, startPos, s.getPos());
}

/**
 * ```abnf
 * Break = "break" ["#" IDENT [Expr]]
 * ```
*/
function parseBreak(s: ITokenStream): Ast.Break {
	const startPos = s.getPos();

	s.expect(TokenKind.BreakKeyword);
	s.next();

	let label: string | undefined;
	let expr: Ast.Expression | undefined;
	if (s.is(TokenKind.Sharp)) {
		label = parseLabel(s);

		if (s.is(TokenKind.Colon)) {
			throw new AiScriptSyntaxError('cannot omit label from break if expression is given', startPos);
		} else if (!isStatementTerminator(s)) {
			expr = parseExpr(s, false);
		}
	}

	return NODE('break', { label, expr }, startPos, s.getPos());
}

/**
 * ```abnf
 * Continue = "continue" ["#" IDENT]
 * ```
*/
function parseContinue(s: ITokenStream): Ast.Continue {
	const startPos = s.getPos();

	s.expect(TokenKind.ContinueKeyword);
	s.next();

	let label: string | undefined;
	if (s.is(TokenKind.Sharp)) {
		label = parseLabel(s);
	}

	return NODE('continue', { label }, startPos, s.getPos());
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

function isStatementTerminator(s: ITokenStream): boolean {
	switch (s.getTokenKind()) {
		case TokenKind.EOF:
		case TokenKind.NewLine:
		case TokenKind.WhileKeyword:
		case TokenKind.ElifKeyword:
		case TokenKind.ElseKeyword:
		case TokenKind.Comma:
		case TokenKind.SemiColon:
		case TokenKind.CloseBrace:
			return true;
		default:
			return false;
	}
}
