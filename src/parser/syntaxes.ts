import { AiScriptSyntaxError } from '../error.js';
import { TokenKind } from './token.js';
import { TokenStream } from './streams/token-stream.js';
import type { ITokenStream } from './streams/token-stream.js';

import type * as Cst from './node.js';

//#region Top-level Statement

/**
 * ```abnf
 * TopLevel = *(Namespace / Meta / Statement)
 * ```
*/
export function parseTopLevel(s: ITokenStream): Cst.Node[] {
	const nodes: Cst.Node[] = [];

	while (s.kind !== TokenKind.EOF) {
		switch (s.token.kind) {
			case TokenKind.Colon2: {
				nodes.push(parseNamespace(s));
				break;
			}
			case TokenKind.Sharp3: {
				nodes.push(parseMeta(s));
				break;
			}
			default: {
				nodes.push(parseStatement(s));
				break;
			}
		}
	}

	return nodes;
}

/**
 * ```abnf
 * Namespace = "::" IDENT "{" *(VarDef / FnDef / Namespace) "}"
 * ```
*/
function parseNamespace(s: ITokenStream): Cst.Node {
	s.nextWith(TokenKind.Colon2);

	s.expect(TokenKind.Identifier);
	const name = s.token.value!;
	s.next();

	const members: Cst.Node[] = [];
	s.nextWith(TokenKind.OpenBrace);
	while (s.kind !== TokenKind.CloseBrace) {
		switch (s.token.kind) {
			case TokenKind.VarKeyword:
			case TokenKind.LetKeyword: {
				members.push(parseVarDef(s));
				break;
			}
			case TokenKind.At: {
				members.push(parseFnDef(s));
				break;
			}
			case TokenKind.Colon2: {
				members.push(parseNamespace(s));
				break;
			}
		}
	}
	s.nextWith(TokenKind.CloseBrace);

	return NODE('ns', { name, members });
}

/**
 * ```abnf
 * Meta = "###" [IDENT] StaticLiteral
 * ```
*/
function parseMeta(s: ITokenStream): Cst.Node {
	s.nextWith(TokenKind.Sharp3);

	let name;
	if (s.kind === TokenKind.Identifier) {
		name = s.token.value;
		s.next();
	}

	const value = parseStaticLiteral(s);

	return NODE('meta', { name, value });
}

//#endregion Top-level Statement

//#region Statement

/**
 * ```abnf
 * Statement = VarDef / FnDef / Out / Return / Attr / Each / For / Loop
 *           / Break / Continue / Assign / Expr
 * ```
*/
function parseStatement(s: ITokenStream): Cst.Node {
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
function parseVarDef(s: ITokenStream): Cst.Node {
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
function parseOut(s: ITokenStream): Cst.Node {
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

function parseFor(s: ITokenStream): Cst.Node {
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
function parseReturn(s: ITokenStream): Cst.Node {
	s.nextWith(TokenKind.ReturnKeyword);
	const expr = parseExpr(s);
	return NODE('return', { expr });
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

//#endregion Statement

//#region Expression

function parseExpr(s: ITokenStream): Cst.Node {
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
function parseIf(s: ITokenStream): Cst.Node {
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

function parseMatch(s: ITokenStream): Cst.Node {
	throw new Error('todo');
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

function parseObject(s: ITokenStream): Cst.Node {
	throw new Error('todo');
}

/**
 * ```abnf
 * Array = "[" *(Expr [","]) "]"
 * ```
*/
function parseArray(s: ITokenStream): Cst.Node {
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

//#endregion Expression

//#region Function

/**
 * ```abnf
 * FnDef = "@" IDENT "(" Args ")" [":" Type] Block
 * ```
*/
function parseFnDef(s: ITokenStream): Cst.Node {
	throw new Error('todo');
}

function parseFnExpr(s: ITokenStream): Cst.Node {
	throw new Error('todo');
}

//#endregion Function

//#region Static Literal

function parseStaticLiteral(s: ITokenStream): Cst.Node {
	throw new Error('todo');
}

function parseStaticArray(s: ITokenStream): Cst.Node {
	throw new Error('todo');
}

function parseStaticObject(s: ITokenStream): Cst.Node {
	throw new Error('todo');
}

//#endregion Static Literal

//#region Type

function parseType(s: ITokenStream): Cst.Node {
	throw new Error('todo');
}

function parseFnType(s: ITokenStream): Cst.Node {
	throw new Error('todo');
}

function parseNamedType(s: ITokenStream): Cst.Node {
	throw new Error('todo');
}

//#endregion Type

//#region Common

function NODE(type: string, params: Record<string, any>): Cst.Node {
	const node: Record<string, any> = { type };
	//params.children;
	for (const key of Object.keys(params)) {
		if (params[key] !== undefined) {
			node[key] = params[key];
		}
	}
	//node.loc = { start, end };
	return node as Cst.Node;
}

/**
 * ```abnf
 * Block = "{" *Statement "}"
 * ```
*/
function parseBlock(s: ITokenStream): Cst.Node[] {
	s.nextWith(TokenKind.OpenBrace);

	const steps: Cst.Node[] = [];
	while (s.kind !== TokenKind.CloseBrace) {
		steps.push(parseStatement(s));
	}

	s.nextWith(TokenKind.CloseBrace);

	return steps;
}

/**
 * ```abnf
 * BlockOrStatement = Block / Statement
 * ```
*/
function parseBlockOrStatement(s: ITokenStream): Cst.Node {
	if (s.kind === TokenKind.OpenBrace) {
		const statements = parseBlock(s);
		return NODE('block', { statements });
	} else {
		return parseStatement(s);
	}
}

//#endregion Common
