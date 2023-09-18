import { AiScriptSyntaxError } from '../error.js';
import type { Cst } from '../index.js';
import type { TokenStream } from './token-stream.js';
import { TokenKind } from './token.js';

//#region Top-level Statement

/**
 * ```text
 * <TopLevel> = (<Namespace> | <Meta> | <Statement>)*
 * ```
*/
export function parseTopLevel(s: TokenStream): Cst.Node[] {
	const nodes: Cst.Node[] = [];

	while (!s.kindIs(TokenKind.EOF)) {
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
 * ```text
 * <Namespace> = "::" <IDENT> "{" (<VarDef> | <FnDef> | <Namespace>)* "}"
 * ```
*/
function parseNamespace(s: TokenStream): Cst.Node {
	s.consumeAs(TokenKind.Colon2);

	s.expect(TokenKind.Identifier);
	const name = s.token.value!;
	s.next();

	const members: Cst.Node[] = [];
	s.consumeAs(TokenKind.OpenBrace);
	while (!s.kindIs(TokenKind.CloseBrace)) {
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
	s.consumeAs(TokenKind.CloseBrace);

	return NODE('ns', { name, members });
}

/**
 * <Meta> = "###" <IDENT>? <StaticLiteral>
*/
function parseMeta(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

//#endregion Top-level Statement

//#region Statement

/**
 * ```text
 * <Statement> = <VarDef> | <FnDef> | <Out> | <Return> | <Attr> | <Each> | <For> | <Loop>
 *             | <Break> | <Continue> | <Assign> | <Expr>
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
		default: {
			throw new Error('todo');
		}
	}
}

/**
 * ```text
 * <VarDef> = ("let" | "var") <IDENT> (":" <Type>)? "=" <Expr>
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
	if (s.kindIs(TokenKind.Colon)) {
		s.next();
		ty = parseType(s);
	}

	s.consumeAs(TokenKind.Eq);

	const expr = parseExpr(s);

	return NODE('def', { name, varType: ty, expr, mut, attr: [] });
}

function parseOut(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

// Attr

function parseEach(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

function parseFor(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

function parseReturn(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

function parseLoop(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

function parseBreak(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

function parseContinue(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

function parseAssign(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

//#endregion Statement

//#region Expression

function parseExpr(s: TokenStream): Cst.Node {
	switch (s.token.kind) {
		case TokenKind.NumberLiteral: {
			const value = Number(s.token.value!);
			s.next();
			return NODE('num', { value });
		}
		default: {
			throw new Error('todo');
		}
	}
}

function parseIf(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

function parseMatch(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

function parseEval(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

function parseExists(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

function parseReference(s: TokenStream): Cst.Node {
	throw new Error('todo');
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
 * ```text
 * <FnDef> = "@" <IDENT> "(" <Args> ")" (":" <Type>)? <Block>
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
 * ```text
 * <NamePath> = <Identifier> (":" <Identifier>)*
 * ```
*/
function parseNamePath(s: TokenStream): string {
	throw new Error('todo');
}

/**
 * ```text
 * <Block> = "{" <Statement>* "}"
 * ```
*/
function parseBlock(s: TokenStream): Cst.Node[] {
	throw new Error('todo');
}

/**
 * ```text
 * <BlockOrStatement> = <Block> | <Statement>
 * ```
*/
function parseBlockOrStatement(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

//#endregion Common
