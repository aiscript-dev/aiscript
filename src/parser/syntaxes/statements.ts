import { AiScriptSyntaxError } from '../../error.js';
import { TokenKind } from '../token.js';
import { TokenStream } from '../streams/token-stream.js';
import type { ITokenStream } from '../streams/token-stream.js';
import { NODE } from '../node.js';
import type * as Cst from '../node.js';

import { parseBlock, parseType } from './common.js';
import { parseExpr } from './expressions.js';
import { parseFnDef } from './function.js';

/**
 * ```abnf
 * Statement = VarDef / FnDef / Out / Return / Attr / Each / For / Loop
 *           / Break / Continue / Assign / Expr
 * ```
*/
export function parseStatement(s: ITokenStream): Cst.Node {
	switch (s.token.kind) {
		case TokenKind.VarKeyword:
		case TokenKind.LetKeyword: {
			return parseVarDef(s);
		}
		case TokenKind.At: {
			return parseFnDef(s);
		}
		case TokenKind.Out: {
			return parseOut(s);
		}
		case TokenKind.ReturnKeyword: {
			return parseReturn(s);
		}
		// Attr
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
			return NODE('break', {});
		}
		case TokenKind.ContinueKeyword: {
			s.next();
			return NODE('continue', {});
		}
		default: {
			const expr = parseExpr(s);
			const assign = tryParseAssign(s, expr);
			if (assign) {
				return assign;
			}
			return expr;
		}
	}
}

/**
 * ```abnf
 * VarDef = ("let" / "var") IDENT [":" Type] "=" Expr
 * ```
*/
export function parseVarDef(s: ITokenStream): Cst.Node {
	let mut;
	switch (s.token.kind) {
		case TokenKind.LetKeyword: {
			mut = false;
			break;
		}
		case TokenKind.VarKeyword: {
			mut = true;
			break;
		}
		default: {
			throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[s.token.kind]}`);
		}
	}
	s.next();

	s.expect(TokenKind.Identifier);
	const name = s.token.value!;
	s.next();

	let ty;
	if (s.kind === TokenKind.Colon) {
		s.next();
		ty = parseType(s);
	}

	s.nextWith(TokenKind.Eq);

	const expr = parseExpr(s);

	return NODE('def', { name, varType: ty, expr, mut, attr: [] });
}

/**
 * ```abnf
 * Out = "<:" Expr
 * ```
*/
export function parseOut(s: ITokenStream): Cst.Node {
	s.nextWith(TokenKind.Out);
	const expr = parseExpr(s);
	return NODE('identifier', {
		name: 'print',
		chain: [NODE('callChain', { args: [expr] })],
	});
}

/**
 * ```abnf
 * Each = "each" "let" IDENT [","] Expr BlockOrStatement
 *      / "each" "(" "let" IDENT [","] Expr ")" BlockOrStatement
 * ```
*/
export function parseEach(s: ITokenStream): Cst.Node {
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

	if (s.kind == TokenKind.Comma) {
		s.next();
	}

	const items = parseExpr(s);

	if (hasParen) {
		s.nextWith(TokenKind.CloseParen);
	}

	const body = parseBlockOrStatement(s);

	return NODE('each', {
		var: name,
		items: items,
		for: body,
	});
}

export function parseFor(s: ITokenStream): Cst.Node {
	let hasParen = false;

	s.nextWith(TokenKind.ForKeyword);

	if (s.kind === TokenKind.OpenParen) {
		hasParen = true;
		s.next();
	}

	if (s.kind == TokenKind.LetKeyword) {
		// range syntax
		s.next();

		s.expect(TokenKind.Identifier);
		const name = s.token.value!;
		s.next();

		let from;
		if ((s.kind as TokenKind) == TokenKind.Eq) {
			s.next();
			from = parseExpr(s);
		} else {
			from = NODE('num', { value: 0 });
		}

		const to = parseExpr(s);

		if (hasParen) {
			s.nextWith(TokenKind.CloseParen);
		}

		const body = parseBlockOrStatement(s);

		return NODE('for', {
			var: name,
			from,
			to,
			for: body,
		});
	} else {
		// times syntax

		const times = parseExpr(s);

		if (hasParen) {
			s.nextWith(TokenKind.CloseParen);
		}
	
		const body = parseBlockOrStatement(s);

		return NODE('for', {
			times,
			for: body,
		});
	}
}

/**
 * ```abnf
 * Return = "return" Expr
 * ```
*/
export function parseReturn(s: ITokenStream): Cst.Node {
	s.nextWith(TokenKind.ReturnKeyword);
	const expr = parseExpr(s);
	return NODE('return', { expr });
}

/**
 * ```abnf
 * Loop = "loop" Block
 * ```
*/
export function parseLoop(s: ITokenStream): Cst.Node {
	s.nextWith(TokenKind.LoopKeyword);
	const statements = parseBlock(s);
	return NODE('loop', { statements });
}

/**
 * ```abnf
 * Assign = Expr ("=" / "+=" / "-=") Expr
 * ```
*/
export function tryParseAssign(s: ITokenStream, dest: Cst.Node): Cst.Node | undefined {
	// Assign
	switch (s.kind) {
		case TokenKind.Eq: {
			s.next();
			const expr = parseExpr(s);
			return NODE('assign', { dest, expr });
		}
		case TokenKind.PlusEq: {
			s.next();
			const expr = parseExpr(s);
			return NODE('addAssign', { dest, expr });
		}
		case TokenKind.MinusEq: {
			s.next();
			const expr = parseExpr(s);
			return NODE('subAssign', { dest, expr });
		}
		default: {
			return;
		}
	}
}

/**
 * ```abnf
 * BlockOrStatement = Block / Statement
 * ```
*/
export function parseBlockOrStatement(s: ITokenStream): Cst.Node {
	if (s.kind === TokenKind.OpenBrace) {
		const statements = parseBlock(s);
		return NODE('block', { statements });
	} else {
		return parseStatement(s);
	}
}
