/**
 * 制御構造
 */

import { AiScriptSyntaxError } from '../../../error.js';
import { TokenKind } from '../../token.js';
import { unexpectedTokenError, NODE } from '../../utils.js';
import { parseBlock, parseDest, parseOptionalSeparator } from '../common.js';
import { parseExpr } from './index.js';

import type * as Ast from '../../../node.js';
import type { ITokenStream } from '../../streams/token-stream.js';

/**
 * ```abnf
 * ControlFlowExpr = ["#" IDENT ":"] ControlFlowExprWithoutLabel
 * ```
*/
export function parseControlFlowExpr(s: ITokenStream): Ast.ControlFlow {
	let label: string | undefined;
	if (s.is(TokenKind.Sharp)) {
		s.next();

		s.expect(TokenKind.Identifier);
		label = s.getTokenValue();
		s.next();

		s.expect(TokenKind.Colon);
		s.next();
	}

	const statement = parseControlFlowExprWithoutLabel(s);
	statement.label = label;
	return statement;
}

/**
 * ```abnf
 * ControlFlowExprWithoutLabel = If / Match / Eval / Each / For / Loop
 * ```
*/
export function parseControlFlowExprWithoutLabel(s: ITokenStream): Ast.ControlFlow {
	const tokenKind = s.getTokenKind();
	switch (tokenKind) {
		case TokenKind.IfKeyword: {
			return parseIf(s);
		}
		case TokenKind.MatchKeyword: {
			return parseMatch(s);
		}
		case TokenKind.EvalKeyword: {
			return parseEval(s);
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
	}
	throw unexpectedTokenError(tokenKind, s.getPos());
}

/**
 * ```abnf
 * If = "if" Expr Block *("elif" Expr Block) ["else" Block]
 * ```
*/
function parseIf(s: ITokenStream): Ast.If {
	const startPos = s.getPos();

	s.expect(TokenKind.IfKeyword);
	s.next();
	const cond = parseExpr(s, false);
	const then = parseBlockAsExpr(s);

	if (s.is(TokenKind.NewLine) && [TokenKind.ElifKeyword, TokenKind.ElseKeyword].includes(s.lookahead(1).kind)) {
		s.next();
	}

	const elseif: Ast.If['elseif'] = [];
	while (s.is(TokenKind.ElifKeyword)) {
		s.next();
		const elifCond = parseExpr(s, false);
		const elifThen = parseBlockAsExpr(s);
		if (s.is(TokenKind.NewLine) && [TokenKind.ElifKeyword, TokenKind.ElseKeyword].includes(s.lookahead(1).kind)) {
			s.next();
		}
		elseif.push({ cond: elifCond, then: elifThen });
	}

	let _else = undefined;
	if (s.is(TokenKind.ElseKeyword)) {
		s.next();
		_else = parseBlockAsExpr(s);
	}

	return NODE('if', { cond, then, elseif, else: _else }, startPos, s.getPos());
}

/**
 * ```abnf
 * Match = "match" Expr "{" [(MatchCase *(SEP MatchCase) [SEP DefaultCase] [SEP]) / DefaultCase [SEP]] "}"
 * ```
*/
function parseMatch(s: ITokenStream): Ast.Match {
	const startPos = s.getPos();

	s.expect(TokenKind.MatchKeyword);
	s.next();
	const about = parseExpr(s, false);

	s.expect(TokenKind.OpenBrace);
	s.next();

	if (s.is(TokenKind.NewLine)) {
		s.next();
	}

	const qs: Ast.Match['qs'] = [];
	let x: Ast.Match['default'];
	if (s.is(TokenKind.CaseKeyword)) {
		qs.push(parseMatchCase(s));
		let sep = parseOptionalSeparator(s);
		while (s.is(TokenKind.CaseKeyword)) {
			if (!sep) {
				throw new AiScriptSyntaxError('separator expected', s.getPos());
			}
			qs.push(parseMatchCase(s));
			sep = parseOptionalSeparator(s);
		}
		if (s.is(TokenKind.DefaultKeyword)) {
			if (!sep) {
				throw new AiScriptSyntaxError('separator expected', s.getPos());
			}
			x = parseDefaultCase(s);
			parseOptionalSeparator(s);
		}
	} else if (s.is(TokenKind.DefaultKeyword)) {
		x = parseDefaultCase(s);
		parseOptionalSeparator(s);
	}

	s.expect(TokenKind.CloseBrace);
	s.next();

	return NODE('match', { about, qs, default: x }, startPos, s.getPos());
}

/**
 * ```abnf
 * MatchCase = "case" Expr "=>" Block
 * ```
*/
function parseMatchCase(s: ITokenStream): Ast.Match['qs'][number] {
	s.expect(TokenKind.CaseKeyword);
	s.next();
	const q = parseExpr(s, false);
	s.expect(TokenKind.Arrow);
	s.next();
	const a = parseBlockOrExpr(s);
	return { q, a };
}

/**
 * ```abnf
 * DefaultCase = "default" "=>" Block
 * ```
*/
function parseDefaultCase(s: ITokenStream): Ast.Match['default'] {
	s.expect(TokenKind.DefaultKeyword);
	s.next();
	s.expect(TokenKind.Arrow);
	s.next();
	return parseBlockOrExpr(s);
}

/**
 * ```abnf
 * Eval = "eval" Block
 * ```
*/
function parseEval(s: ITokenStream): Ast.Block {
	const startPos = s.getPos();

	s.expect(TokenKind.EvalKeyword);
	s.next();
	const statements = parseBlock(s);

	return NODE('block', { statements }, startPos, s.getPos());
}

/**
 * ```abnf
 * Each = "each" "(" "let" Dest "," Expr ")" Block
 *      / "each"     "let" Dest "," Expr     Block
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

	const body = parseBlockAsExpr(s);

	return NODE('each', {
		var: dest,
		items: items,
		for: body,
	}, startPos, s.getPos());
}

/**
 * ```abnf
 * For = ForRange / ForTimes
 * ForRange = "for" "(" "let" IDENT ["=" Expr] "," Expr ")" Block
 *          / "for"     "let" IDENT ["=" Expr] "," Expr     Block
 * ForTimes = "for" "(" Expr ")" Block
 *          / "for"     Expr     Block
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

		const body = parseBlockAsExpr(s);

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
	
		const body = parseBlockAsExpr(s);

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
 * Loop = "do" Block "while" Expr
 * ```
*/
function parseDoWhile(s: ITokenStream): Ast.Loop {
	const doStartPos = s.getPos();
	s.expect(TokenKind.DoKeyword);
	s.next();
	const body = parseBlockAsExpr(s);
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
				then: NODE('block', {
					statements: [NODE('break', {}, endPos, endPos)],
				}, endPos, endPos),
				elseif: [],
			}, whilePos, endPos),
		],
	}, doStartPos, endPos);
}

/**
 * ```abnf
 * Loop = "while" Expr Block
 * ```
*/
function parseWhile(s: ITokenStream): Ast.Loop {
	const startPos = s.getPos();
	s.expect(TokenKind.WhileKeyword);
	s.next();
	const cond = parseExpr(s, false);
	const condEndPos = s.getPos();
	const body = parseBlockAsExpr(s);

	return NODE('loop', {
		statements: [
			NODE('if', {
				cond: NODE('not', { expr: cond }, startPos, condEndPos),
				then: NODE('block', {
					statements: [NODE('break', {}, condEndPos, condEndPos)],
				}, condEndPos, condEndPos),
				elseif: [],
			}, startPos, condEndPos),
			body,
		],
	}, startPos, s.getPos());
}

/**
 * ```abnf
 * BlockOrExpr = Block / Expr
 * ```
*/
function parseBlockOrExpr(s: ITokenStream): Ast.Expression {
	if (s.is(TokenKind.OpenBrace)) {
		return parseBlockAsExpr(s);
	} else {
		return parseExpr(s, false);
	}
}

function parseBlockAsExpr(s: ITokenStream): Ast.Block {
	const startPos = s.getPos();
	const statements = parseBlock(s);
	return NODE('block', { statements }, startPos, s.getPos());
}
