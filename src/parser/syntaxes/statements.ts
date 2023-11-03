import { AiScriptSyntaxError } from '../../error.js';
import { CALL_NODE } from '../utils.js';
import { TokenKind } from '../token.js';
import { parseBlock, parseParams, parseType } from './common.js';
import { parseExpr } from './expressions.js';
import * as Ast from '../../node.js';

import type { ITokenStream } from '../streams/token-stream.js';

/**
 * ```abnf
 * Statement = VarDef / FnDef / Out / Return / Attr / Each / For / Loop
 *           / Break / Continue / Assign / Expr
 * ```
*/
export function parseStatement(s: ITokenStream): Ast.Statement {
	const loc = s.token.loc;

	switch (s.kind) {
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
		case TokenKind.BreakKeyword: {
			s.next();
			return new Ast.Break(loc);
		}
		case TokenKind.ContinueKeyword: {
			s.next();
			return new Ast.Continue(loc);
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
	switch (s.kind) {
		case TokenKind.VarKeyword:
		case TokenKind.LetKeyword: {
			return parseVarDef(s);
		}
		case TokenKind.At: {
			return parseFnDef(s);
		}
		default: {
			throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[s.kind]}`, s.token.loc);
		}
	}
}

/**
 * ```abnf
 * BlockOrStatement = Block / Statement
 * ```
*/
export function parseBlockOrStatement(s: ITokenStream): Ast.Block | Ast.Statement {
	const loc = s.token.loc;

	if (s.kind === TokenKind.OpenBrace) {
		const statements = parseBlock(s);
		return new Ast.Block(statements, loc);
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
	const loc = s.token.loc;

	let mut;
	switch (s.kind) {
		case TokenKind.LetKeyword: {
			mut = false;
			break;
		}
		case TokenKind.VarKeyword: {
			mut = true;
			break;
		}
		default: {
			throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[s.kind]}`, s.token.loc);
		}
	}
	s.next();

	s.expect(TokenKind.Identifier);
	const name = s.token.value!;
	s.next();

	let type = null;
	if ((s.kind as TokenKind) === TokenKind.Colon) {
		s.next();
		type = parseType(s);
	}

	s.nextWith(TokenKind.Eq);

	if ((s.kind as TokenKind) === TokenKind.NewLine) {
		s.next();
	}

	const expr = parseExpr(s, false);

	return new Ast.Definition(name, type, expr, mut, [], loc);
}

/**
 * ```abnf
 * FnDef = "@" IDENT Params [":" Type] Block
 * ```
*/
function parseFnDef(s: ITokenStream): Ast.Definition {
	const loc = s.token.loc;

	s.nextWith(TokenKind.At);

	s.expect(TokenKind.Identifier);
	const name = s.token.value!;
	s.next();

	const params = parseParams(s);

	let type = null;
	if ((s.kind as TokenKind) === TokenKind.Colon) {
		s.next();
		type = parseType(s);
	}

	const body = parseBlock(s);

	return new Ast.Definition(
		name, null, new Ast.Fn(params, type, body, loc), false, [], loc
	);
}

/**
 * ```abnf
 * Out = "<:" Expr
 * ```
*/
function parseOut(s: ITokenStream): Ast.Call {
	const loc = s.token.loc;

	s.nextWith(TokenKind.Out);
	const expr = parseExpr(s, false);
	return CALL_NODE('print', [expr], loc);
}

/**
 * ```abnf
 * Each = "each" "let" IDENT ("," / SPACE) Expr BlockOrStatement
 *      / "each" "(" "let" IDENT ("," / SPACE) Expr ")" BlockOrStatement
 * ```
*/
function parseEach(s: ITokenStream): Ast.Each {
	const loc = s.token.loc;
	let hasParen = false;

	s.nextWith(TokenKind.EachKeyword);

	if (s.kind === TokenKind.OpenParen) {
		hasParen = true;
		s.next();
	}

	s.nextWith(TokenKind.LetKeyword);

	s.expect(TokenKind.Identifier);
	const name = s.token.value!;
	s.next();

	if (s.kind === TokenKind.Comma) {
		s.next();
	} else if (!s.token.hasLeftSpacing) {
		throw new AiScriptSyntaxError('separator expected', s.token.loc);
	}

	const items = parseExpr(s, false);

	if (hasParen) {
		s.nextWith(TokenKind.CloseParen);
	}

	const body = parseBlockOrStatement(s);

	return new Ast.Each(name, items, body, loc);
}

function parseFor(s: ITokenStream): Ast.For {
	const loc = s.token.loc;
	let hasParen = false;

	s.nextWith(TokenKind.ForKeyword);

	if (s.kind === TokenKind.OpenParen) {
		hasParen = true;
		s.next();
	}

	if (s.kind === TokenKind.LetKeyword) {
		// range syntax
		s.next();

		const identLoc = s.token.loc;

		s.expect(TokenKind.Identifier);
		const name = s.token.value!;
		s.next();

		let _from;
		if ((s.kind as TokenKind) === TokenKind.Eq) {
			s.next();
			_from = parseExpr(s, false);
		} else {
			_from = new Ast.Num(0, identLoc);
		}

		if ((s.kind as TokenKind) === TokenKind.Comma) {
			s.next();
		} else if (!s.token.hasLeftSpacing) {
			throw new AiScriptSyntaxError('separator expected', s.token.loc);
		}

		const to = parseExpr(s, false);

		if (hasParen) {
			s.nextWith(TokenKind.CloseParen);
		}

		const body = parseBlockOrStatement(s);

		return new Ast.For(name, _from, to, null, body, loc);
	} else {
		// times syntax

		const times = parseExpr(s, false);

		if (hasParen) {
			s.nextWith(TokenKind.CloseParen);
		}
	
		const body = parseBlockOrStatement(s);

		return new Ast.For(null, null, null, times, body, loc);
	}
}

/**
 * ```abnf
 * Return = "return" Expr
 * ```
*/
function parseReturn(s: ITokenStream): Ast.Return {
	const loc = s.token.loc;

	s.nextWith(TokenKind.ReturnKeyword);
	const expr = parseExpr(s, false);
	return new Ast.Return(expr, loc);
}

/**
 * ```abnf
 * StatementWithAttr = *Attr Statement
 * ```
*/
function parseStatementWithAttr(s: ITokenStream): Ast.Statement {
	const attrs: Ast.Attribute[] = [];
	while (s.kind === TokenKind.OpenSharpBracket) {
		attrs.push(parseAttr(s));
		s.nextWith(TokenKind.NewLine);
	}

	const statement = parseStatement(s);

	if (statement.type !== 'def') {
		throw new AiScriptSyntaxError('invalid attribute.', statement.loc);
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
	const loc = s.token.loc;

	s.nextWith(TokenKind.OpenSharpBracket);

	s.expect(TokenKind.Identifier);
	const name = s.token.value!;
	s.next();

	let value;
	if (s.kind !== TokenKind.CloseBracket) {
		value = parseExpr(s, true);
	} else {
		value = new Ast.Bool(true, loc);
	}

	s.nextWith(TokenKind.CloseBracket);

	return new Ast.Attribute(name, value, loc);
}

/**
 * ```abnf
 * Loop = "loop" Block
 * ```
*/
function parseLoop(s: ITokenStream): Ast.Loop {
	const loc = s.token.loc;

	s.nextWith(TokenKind.LoopKeyword);
	const statements = parseBlock(s);
	return new Ast.Loop(statements, loc);
}

/**
 * ```abnf
 * Assign = Expr ("=" / "+=" / "-=") Expr
 * ```
*/
function tryParseAssign(s: ITokenStream, dest: Ast.Expression): Ast.Statement | undefined {
	const loc = s.token.loc;

	// Assign
	switch (s.kind) {
		case TokenKind.Eq: {
			s.next();
			const expr = parseExpr(s, false);
			return new Ast.Assign(dest, expr, loc);
		}
		case TokenKind.PlusEq: {
			s.next();
			const expr = parseExpr(s, false);
			return new Ast.AddAssign(dest, expr, loc);
		}
		case TokenKind.MinusEq: {
			s.next();
			const expr = parseExpr(s, false);
			return new Ast.SubAssign(dest, expr, loc);
		}
		default: {
			return;
		}
	}
}
