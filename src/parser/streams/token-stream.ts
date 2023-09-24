import { AiScriptSyntaxError } from '../../error.js';
import { TOKEN, TokenKind } from '../token.js';
import type { Token } from '../token.js';

/**
 * トークンの読み取りに関するインターフェース
*/
export interface ITokenStream {
	get eof(): boolean;
	get token(): Token;
	get kind(): TokenKind;
	next(): void;
	expect(kind: TokenKind): void;
	nextWith(kind: TokenKind): void;
}

/**
 * トークン列からトークンを読み取るクラス
*/
export class TokenStream implements ITokenStream {
	private source: Token[];
	private index: number;
	private _token?: Token;

	constructor(source: TokenStream['source']) {
		this.source = source;
		this.index = 0;
	}

	public init() {
		this.load();
	}

	public get eof(): boolean {
		return (this.index >= this.source.length);
	}

	public get token(): Token {
		if (this._token == null) {
			// EOFトークンさえも入っていなかったらinitされていない
			throw new Error('stream is not initialized yet');
		}
		if (this.eof) {
			throw new Error('end of stream');
		}
		return this._token;
	}

	public get kind(): TokenKind {
		return this.token.kind;
	}

	public next(): void {
		if (!this.eof) {
			this.index++;
		}
		this.load();
	}

	public expect(kind: TokenKind): void {
		if (this.kind !== kind) {
			throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[this.kind]}`);
		}
	}

	public nextWith(kind: TokenKind): void {
		this.expect(kind);
		this.next();
	}

	private load(): void {
		if (this.eof) {
			this._token = TOKEN(TokenKind.EOF, false);
		} else {
			this._token = this.source[this.index];
		}
	}
}
