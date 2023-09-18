import { AiScriptSyntaxError } from '../error.js';
import type { Cst } from '../index.js';
import type { TokenStream } from './token-stream.js';
import { TokenKind } from './token.js';

function createNode(type: string, params: Record<string, any>): Cst.Node {
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


// Top-level Statement ========================================================

/**
 * ```text
 * <TopLevel> = (<Namespace> | <Meta> | <Statement>)*
 * ```
*/
export function parseTopLevel(s: TokenStream): Cst.Node[] {
	const nodes: Cst.Node[] = [];
	while (!s.kindOf(TokenKind.EOF)) {
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
	while (!s.kindOf(TokenKind.CloseBrace)) {
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

	return createNode('ns', { name, members });
}

/**
 * <Meta> = "###" <IDENT>? <StaticLiteral>
*/
function parseMeta(s: TokenStream): Cst.Node {
	throw new Error('todo');
}


// Statement ==================================================================

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
	throw new Error('todo');
}

// Out

// Attr

// Each

// For

// Return

// Loop

// Break

// Continue

// Assign


// Expression =================================================================

// expression

// If

// Match

// Eval

// Exists

// Reference

// template

// object

// array


// Function ===================================================================

/**
 * ```text
 * <FnDef> = "@" <IDENT> "(" <Args> ")" (":" <Type>)? <Block>
 * ```
*/
function parseFnDef(s: TokenStream): Cst.Node {
	throw new Error('todo');
}

// fn expression


// Static Literal =============================================================

// static array

// static object


// Type =======================================================================

// fn type

// named type


// Common =====================================================================

// namespace path

/**
 * ```text
 * <Block> = "{" <Statement>* "}"
 * ```
*/
function parseBlock(s: TokenStream): Cst.Node[] {
	throw new Error('todo');
}

// block or statement
