import { AiScriptSyntaxError } from '../../error.js';
import { CALL_NODE, NODE } from '../node.js';
import { TokenKind } from '../token.js';
import { parseBlock, parseParams, parseType } from './common.js';
import { parseExpr } from './expressions.js';

import type * as Cst from '../node.js';
import type { ITokenStream } from '../streams/token-stream.js';

/**
 * ```abnf
 * Statement = VarDef / FnDef / Out / Return / Attr / Each / For / Loop
 *           / Break / Continue / Assign / Expr
 * ```
*/
export function parseStatement(s: ITokenStream): Cst.Node {
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
			return NODE('break', {});
		}
		case TokenKind.ContinueKeyword: {
			s.next();
			return NODE('continue', {});
		}
	}
	const expr = parseExpr(s);
	const assign = tryParseAssign(s, expr);
	if (assign) {
		return assign;
	}
	return expr;
}

export function parseDefStatement(s: ITokenStream) {
	switch (s.kind) {
		case TokenKind.VarKeyword:
		case TokenKind.LetKeyword: {
			return parseVarDef(s);
		}
		case TokenKind.At: {
			return parseFnDef(s);
		}
		default: {
			throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[s.kind]}`);
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

/**
 * ```abnf
 * VarDef = ("let" / "var") IDENT [":" Type] "=" Expr
 * ```
*/
function parseVarDef(s: ITokenStream): Cst.Node {
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
			throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[s.kind]}`);
		}
	}
	s.next();

	s.expect(TokenKind.Identifier);
	const name = s.token.value!;
	s.next();

	let ty;
	if ((s.kind as TokenKind) === TokenKind.Colon) {
		s.next();
		ty = parseType(s);
	}

	s.nextWith(TokenKind.Eq);

	const expr = parseExpr(s);

	return NODE('def', { name, varType: ty, expr, mut, attr: [] });
}

/**
 * ```abnf
 * FnDef = "@" IDENT Params [":" Type] Block
 * ```
*/
function parseFnDef(s: ITokenStream): Cst.Node {
	s.nextWith(TokenKind.At);

	s.expect(TokenKind.Identifier);
	const name = s.token.value;
	s.next();

	const params = parseParams(s);

	// type

	const body = parseBlock(s);

	return NODE('def', {
		name,
		expr: NODE('fn', {
			args: params,
			retType: undefined, // TODO: type
			children: body,
		}),
		mut: false,
		attr: [],
	});
}

/**
 * ```abnf
 * Out = "<:" Expr
 * ```
*/
function parseOut(s: ITokenStream): Cst.Node {
	s.nextWith(TokenKind.Out);
	const expr = parseExpr(s);
	return CALL_NODE('print', [expr]);
}

/**
 * ```abnf
 * Each = "each" "let" IDENT [","] Expr BlockOrStatement
 *      / "each" "(" "let" IDENT [","] Expr ")" BlockOrStatement
 * ```
*/
function parseEach(s: ITokenStream): Cst.Node {
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

function parseFor(s: ITokenStream): Cst.Node {
	let hasParen = false;

	s.nextWith(TokenKind.ForKeyword);

	if (s.kind === TokenKind.OpenParen) {
		hasParen = true;
		s.next();
	}

	if (s.kind === TokenKind.LetKeyword) {
		// range syntax
		s.next();

		s.expect(TokenKind.Identifier);
		const name = s.token.value!;
		s.next();

		let _from;
		if ((s.kind as TokenKind) === TokenKind.Eq) {
			s.next();
			_from = parseExpr(s);
		} else {
			_from = NODE('num', { value: 0 });
		}

		const to = parseExpr(s);

		if (hasParen) {
			s.nextWith(TokenKind.CloseParen);
		}

		const body = parseBlockOrStatement(s);

		return NODE('for', {
			var: name,
			from: _from,
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
function parseReturn(s: ITokenStream): Cst.Node {
	s.nextWith(TokenKind.ReturnKeyword);
	const expr = parseExpr(s);
	return NODE('return', { expr });
}

/**
 * ```abnf
 * StatementWithAttr = *Attr Statement
 * ```
*/
function parseStatementWithAttr(s: ITokenStream): Cst.Node {
	const attrs: Cst.Attribute[] = [];
	while (s.kind === TokenKind.OpenSharpBracket) {
		attrs.push(parseAttr(s) as Cst.Attribute);
	}

	const statement = parseStatement(s);

	if (statement.type !== 'def') {
		throw new AiScriptSyntaxError('invalid attribute.');
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
 * Attr = "#[" IDENT [StaticLiteral] "]"
 * ```
*/
function parseAttr(s: ITokenStream): Cst.Node {
	s.nextWith(TokenKind.OpenSharpBracket);

	s.expect(TokenKind.Identifier);
	const name = s.token.value!;
	s.next();

	// TODO: value

	s.nextWith(TokenKind.CloseBracket);

	return NODE('attr', { name, value: undefined });
}

/**
 * ```abnf
 * Loop = "loop" Block
 * ```
*/
function parseLoop(s: ITokenStream): Cst.Node {
	s.nextWith(TokenKind.LoopKeyword);
	const statements = parseBlock(s);
	return NODE('loop', { statements });
}

/**
 * ```abnf
 * Assign = Expr ("=" / "+=" / "-=") Expr
 * ```
*/
function tryParseAssign(s: ITokenStream, dest: Cst.Node): Cst.Node | undefined {
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
