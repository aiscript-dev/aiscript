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
	private seq: Token[];
	private _token?: Token;
	private index: number;

	constructor(sequence: TokenStream['seq']) {
		this.seq = sequence;
		this.index = 0;
	}

	public init() {
		this.next();
	}

	public get eof(): boolean {
		return (this.index >= this.seq.length);
	}

	public get token(): Token {
		if (this._token == null) {
			throw new Error('stream is not initialized yet');
		}
		return this._token;
	}

	public get kind(): TokenKind {
		return this.token.kind;
	}

	public next(): void {
		if (this.eof) {
			this._token = TOKEN(TokenKind.EOF);
		} else {
			this._token = this.seq[this.index];
			this.index++;
		}
	}

	public expect(kind: TokenKind): void {
		if (this.kind !== kind) {
			throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[this.token.kind]}`);
		}
	}

	public nextWith(kind: TokenKind): void {
		this.expect(kind);
		this.next();
	}
}
