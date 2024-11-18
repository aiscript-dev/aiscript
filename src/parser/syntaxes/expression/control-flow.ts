/**
 * 制御構造
 */

import { AiScriptSyntaxError } from '../../../error.js';
import { TokenKind } from '../../token.js';
import { unexpectedTokenError, NODE } from '../../utils.js';
import { parseBlock, parseDest } from '../common.js';
import { parseBlockOrStatement } from '../statements.js';
import { parseExpr } from './index.js';

import type * as Ast from '../../../node.js';
import type { ITokenStream } from '../../streams/token-stream.js';

/**
 * ```abnf
 * ExprWithLabel = "#" IDENT ":" Expression
 * ```
*/
export function parseExprWithLabel(s: ITokenStream): Ast.Each | Ast.For | Ast.Loop {
	s.expect(TokenKind.Sharp);
	s.next();

	s.expect(TokenKind.Identifier);
	const label = s.getTokenValue();
	s.next();

	s.expect(TokenKind.Colon);
	s.next();

	const statement = parseControlFlowExpr(s);
	statement.label = label;
	return statement;
}

export function parseControlFlowExpr(s: ITokenStream): Ast.Each | Ast.For | Ast.Loop {
	const tokenKind = s.getTokenKind();
	switch (tokenKind) {
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
		default: {
			throw unexpectedTokenError(tokenKind, s.getPos());
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

		s.expect(TokenKind.Identifier);
		const name = s.getTokenValue();
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

		return NODE('for', {
			var: name,
			from: _from,
			to,
			for: body,
		}, startPos, s.getPos());
	} else {
		// times syntax

		const times = parseExpr(s, false);

		if (hasParen) {
			s.expect(TokenKind.CloseParen);
			s.next();
		}
	
		const body = parseBlockOrStatement(s);

		return NODE('for', {
			times,
			for: body,
		}, startPos, s.getPos());
	}
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
