import { AiScriptSyntaxError } from '../../error.js';
import { TokenKind } from '../token.js';
import { TokenStream } from '../streams/token-stream.js';
import type { ITokenStream } from '../streams/token-stream.js';
import { NODE } from '../node.js';
import type * as Cst from '../node.js';

/**
 * ```abnf
 * FnDef = "@" IDENT "(" Args ")" [":" Type] Block
 * ```
*/
export function parseFnDef(s: ITokenStream): Cst.Node {
	throw new Error('todo');
}

export function parseFnExpr(s: ITokenStream): Cst.Node {
	throw new Error('todo');
}
