import { AiScriptSyntaxError } from '../error.js';
import type { Cst } from '../index.js';
import type { TokenStream } from './token-stream.js';
import { TokenKind } from './token.js';

//#region Top-level Statement

/**
 * ```abnf
 * TopLevel = *(Namespace / Meta / Statement)
 * ```
*/
export function parseTopLevel(s: TokenStream): Cst.Node[] {
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
function parseNamespace(s: TokenStream): Cst.Node {
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
function parseMeta(s: TokenStream): Cst.Node {
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
function parseStatement(s: TokenStream): Cst.Node {
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
		// Each
		// For
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
		// Assign
		default: {
			return parseExpr(s);
		}
	}
}

/**
 * ```abnf
 * VarDef = ("let" / "var") IDENT [":" Type] "=" Expr
 * ```
*/
function parseVarDef(s: TokenStream): Cst.Node {
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
function parseOut(s: TokenStream): Cst.Node {
	s.nextWith(TokenKind.Out);
	const expr = parseExpr(s);
	return NODE('identifier', {
		name: 'print',
		chain: [NODE('callChain', { args: [expr] })],
	});
}

function parseAttr(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

function parseEach(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

function parseFor(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

/**
 * ```abnf
 * Return = "return" Expr
 * ```
*/
function parseReturn(s: TokenStream): Cst.Node {
	s.nextWith(TokenKind.ReturnKeyword);
	const expr = parseExpr(s);
	return NODE('return', { expr });
}

/**
 * ```abnf
 * Loop = "loop" Block
 * ```
*/
function parseLoop(s: TokenStream): Cst.Node {
	s.nextWith(TokenKind.LoopKeyword);
	const statements = parseBlock(s);
	return NODE('loop', { statements });
}

function parseAssign(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

//#endregion Statement

//#region Expression

function parseExpr(s: TokenStream): Cst.Node {
	// TODO: Pratt parsing

	switch (s.token.kind) {
		case TokenKind.NumberLiteral: {
			// TODO: sign
			// TODO: validate value
			const value = Number(s.token.value!);
			s.next();
			return NODE('num', { value });
		}
		case TokenKind.IfKeyword: {
			return parseIf(s);
		}
		case TokenKind.EvalKeyword: {
			return parseEval(s);
		}
		case TokenKind.ExistsKeyword: {
			return parseExists(s);
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
function parseIf(s: TokenStream): Cst.Node {
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

function parseMatch(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

/**
 * ```abnf
 * Eval = "eval" Block
 * ```
*/
function parseEval(s: TokenStream): Cst.Node {
	s.nextWith(TokenKind.EvalKeyword);
	const statements = parseBlock(s);
	return NODE('block', { statements });
}

/**
 * ```abnf
 * Exists = "exists" Reference
 * ```
*/
function parseExists(s: TokenStream): Cst.Node {
	s.nextWith(TokenKind.ExistsKeyword);
	const identifier = parseReference(s);
	return NODE('exists', { identifier });
}

/**
 * ```abnf
 * Reference = IDENT *(":" IDENT)
 * ```
*/
function parseReference(s: TokenStream): Cst.Node {
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

function parseTemplate(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

function parseObject(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

function parseArray(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

//#endregion Expression

//#region Function

/**
 * ```abnf
 * FnDef = "@" IDENT "(" Args ")" [":" Type] Block
 * ```
*/
function parseFnDef(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

function parseFnExpr(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

//#endregion Function

//#region Static Literal

function parseStaticLiteral(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

function parseStaticArray(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

function parseStaticObject(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

//#endregion Static Literal

//#region Type

function parseType(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

function parseFnType(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

function parseNamedType(s: TokenStream): Cst.Node {
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
function parseBlock(s: TokenStream): Cst.Node[] {
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
function parseBlockOrStatement(s: TokenStream): Cst.Node {
	if (s.kind === TokenKind.OpenBrace) {
		const statements = parseBlock(s);
		return NODE('block', { statements });
	} else {
		return parseStatement(s);
	}
}

//#endregion Common
