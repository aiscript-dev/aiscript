import { AiScriptSyntaxError } from '../../error.js';
import { CALL_NODE, NODE } from '../utils.js';
import { TokenKind } from '../token.js';
import { parseBlock, parseParams, parseType } from './common.js';
import { parseExpr } from './expressions.js';

import type * as Ast from '../../node.js';
import type { ITokenStream } from '../streams/token-stream.js';

/**
 * ```abnf
 * Statement = VarDef / FnDef / Out / Return / Attr / Each / For / Loop
 *           / Break / Continue / Assign / Expr
 * ```
*/
export function parseStatement(s: ITokenStream): Ast.Statement | Ast.Expression {
	const startPos = s.getPos();

	switch (s.getKind()) {
		case TokenKind.VarKeyword:
		case TokenKind.LetKeyword: {
			return parseVarDef(s);
		}
		case TokenKind.At: {
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
			s.next();
			return NODE('break', {}, startPos, s.getPos());
		}
		case TokenKind.ContinueKeyword: {
			s.next();
			return NODE('continue', {}, startPos, s.getPos());
		}
	}
	const expr = parseExpr(s, false);
	const assign = tryParseAssign(s, expr);
	if (assign) {
		return assign;
	}
	return expr;
}

export function parseDefStatement(s: ITokenStream): Ast.Definition {
	switch (s.getKind()) {
		case TokenKind.VarKeyword:
		case TokenKind.LetKeyword: {
			return parseVarDef(s);
		}
		case TokenKind.At: {
			return parseFnDef(s);
		}
		default: {
			throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[s.getKind()]}`, s.getPos());
		}
	}
}

/**
 * ```abnf
 * BlockOrStatement = Block / Statement
 * ```
*/
export function parseBlockOrStatement(s: ITokenStream): Ast.Statement | Ast.Expression {
	if (s.getKind() === TokenKind.OpenBrace) {
		const startPos = s.getPos();
		const statements = parseBlock(s);
		return NODE('block', { statements }, startPos, s.getPos());
	} else {
		return parseStatement(s);
	}
}

/**
 * ```abnf
 * VarDef = ("let" / "var") IDENT [":" Type] "=" Expr
 * ```
*/
function parseVarDef(s: ITokenStream): Ast.Definition {
	const startPos = s.getPos();

	let mut;
	switch (s.getKind()) {
		case TokenKind.LetKeyword: {
			mut = false;
			break;
		}
		case TokenKind.VarKeyword: {
			mut = true;
			break;
		}
		default: {
			throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[s.getKind()]}`, s.getPos());
		}
	}
	s.next();

	s.expect(TokenKind.Identifier);
	const name = s.token.value!;
	s.next();

	let type;
	if (s.getKind() === TokenKind.Colon) {
		s.next();
		type = parseType(s);
	}

	s.nextWith(TokenKind.Eq);

	if (s.getKind() === TokenKind.NewLine) {
		s.next();
	}

	const expr = parseExpr(s, false);

	return NODE('def', { name, varType: type, expr, mut, attr: [] }, startPos, s.getPos());
}

/**
 * ```abnf
 * FnDef = "@" IDENT Params [":" Type] Block
 * ```
*/
function parseFnDef(s: ITokenStream): Ast.Definition {
	const startPos = s.getPos();

	s.nextWith(TokenKind.At);

	s.expect(TokenKind.Identifier);
	const name = s.token.value;
	s.next();

	const params = parseParams(s);

	let type;
	if (s.getKind() === TokenKind.Colon) {
		s.next();
		type = parseType(s);
	}

	const body = parseBlock(s);

	const endPos = s.getPos();

	return NODE('def', {
		name,
		expr: NODE('fn', {
			args: params,
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

	s.nextWith(TokenKind.Out);
	const expr = parseExpr(s, false);

	return CALL_NODE('print', [expr], startPos, s.getPos());
}

/**
 * ```abnf
 * Each = "each" "let" IDENT ("," / SPACE) Expr BlockOrStatement
 *      / "each" "(" "let" IDENT ("," / SPACE) Expr ")" BlockOrStatement
 * ```
*/
function parseEach(s: ITokenStream): Ast.Each {
	const startPos = s.getPos();
	let hasParen = false;

	s.nextWith(TokenKind.EachKeyword);

	if (s.getKind() === TokenKind.OpenParen) {
		hasParen = true;
		s.next();
	}

	s.nextWith(TokenKind.LetKeyword);

	s.expect(TokenKind.Identifier);
	const name = s.token.value!;
	s.next();

	if (s.getKind() === TokenKind.Comma) {
		s.next();
	} else {
		throw new AiScriptSyntaxError('separator expected', s.getPos());
	}

	const items = parseExpr(s, false);

	if (hasParen) {
		s.nextWith(TokenKind.CloseParen);
	}

	const body = parseBlockOrStatement(s);

	return NODE('each', {
		var: name,
		items: items,
		for: body,
	}, startPos, s.getPos());
}

function parseFor(s: ITokenStream): Ast.For {
	const startPos = s.getPos();
	let hasParen = false;

	s.nextWith(TokenKind.ForKeyword);

	if (s.getKind() === TokenKind.OpenParen) {
		hasParen = true;
		s.next();
	}

	if (s.getKind() === TokenKind.LetKeyword) {
		// range syntax
		s.next();

		const identPos = s.getPos();

		s.expect(TokenKind.Identifier);
		const name = s.token.value!;
		s.next();

		let _from;
		if (s.getKind() === TokenKind.Eq) {
			s.next();
			_from = parseExpr(s, false);
		} else {
			_from = NODE('num', { value: 0 }, identPos, identPos);
		}

		if (s.getKind() === TokenKind.Comma) {
			s.next();
		} else {
			throw new AiScriptSyntaxError('separator expected', s.getPos());
		}

		const to = parseExpr(s, false);

		if (hasParen) {
			s.nextWith(TokenKind.CloseParen);
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
			s.nextWith(TokenKind.CloseParen);
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
 * Return = "return" Expr
 * ```
*/
function parseReturn(s: ITokenStream): Ast.Return {
	const startPos = s.getPos();

	s.nextWith(TokenKind.ReturnKeyword);
	const expr = parseExpr(s, false);

	return NODE('return', { expr }, startPos, s.getPos());
}

/**
 * ```abnf
 * StatementWithAttr = *Attr Statement
 * ```
*/
function parseStatementWithAttr(s: ITokenStream): Ast.Definition {
	const attrs: Ast.Attribute[] = [];
	while (s.getKind() === TokenKind.OpenSharpBracket) {
		attrs.push(parseAttr(s) as Ast.Attribute);
		s.nextWith(TokenKind.NewLine);
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

	s.nextWith(TokenKind.OpenSharpBracket);

	s.expect(TokenKind.Identifier);
	const name = s.token.value!;
	s.next();

	let value;
	if (s.getKind() !== TokenKind.CloseBracket) {
		value = parseExpr(s, true);
	} else {
		const closePos = s.getPos();
		value = NODE('bool', { value: true }, closePos, closePos);
	}

	s.nextWith(TokenKind.CloseBracket);

	return NODE('attr', { name, value }, startPos, s.getPos());
}

/**
 * ```abnf
 * Loop = "loop" Block
 * ```
*/
function parseLoop(s: ITokenStream): Ast.Loop {
	const startPos = s.getPos();

	s.nextWith(TokenKind.LoopKeyword);
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
	s.nextWith(TokenKind.DoKeyword);
	const body = parseBlockOrStatement(s);
	const whilePos = s.getPos();
	s.nextWith(TokenKind.WhileKeyword);
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
	s.nextWith(TokenKind.WhileKeyword);
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
 * Assign = Expr ("=" / "+=" / "-=") Expr
 * ```
*/
function tryParseAssign(s: ITokenStream, dest: Ast.Expression): Ast.Statement | undefined {
	const startPos = s.getPos();

	// Assign
	switch (s.getKind()) {
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
