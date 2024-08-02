import { AiScriptSyntaxError } from '../../error.js';
import { TOKEN, TokenKind } from '../token.js';
import type { Token, TokenPosition } from '../token.js';

/**
 * トークンの読み取りに関するインターフェース
*/
export interface ITokenStream {
	/**
	 * カーソル位置にあるトークンを取得します。
	*/
	getToken(): Token;

	/**
	 * カーソル位置にあるトークンの種類が指定したトークンの種類と一致するかどうかを示す値を取得します。
	*/
	is(kind: TokenKind | TokenKind[]): boolean;

	/**
	 * カーソル位置にあるトークンの種類を取得します。
	*/
	getTokenKind(): TokenKind;

	/**
	 * カーソル位置にあるトークンに含まれる値を取得します。
	*/
	getTokenValue(): string;

	/**
	 * カーソル位置にあるトークンの位置情報を取得します。
	*/
	getPos(): TokenPosition;

	/**
	 * カーソル位置を次のトークンへ進めます。
	*/
	next(): void;

	/**
	 * トークンの先読みを行います。カーソル位置は移動されません。
	*/
	lookahead(offset: number): Token;

	/**
	 * カーソル位置にあるトークンの種類が指定したトークンの種類と一致することを確認します。
	 * 一致しなかった場合には文法エラーを発生させます。
	*/
	expect(kind: TokenKind): void;
}

/**
 * トークン列からトークンを読み取るクラス
*/
export class TokenStream implements ITokenStream {
	private source: Token[];
	private index: number;
	private _token: Token;

	constructor(source: TokenStream['source']) {
		this.source = source;
		this.index = 0;
		this.load();
	}

	private get eof(): boolean {
		return (this.index >= this.source.length);
	}

	/**
	 * カーソル位置にあるトークンを取得します。
	*/
	public getToken(): Token {
		if (this.eof) {
			return TOKEN(TokenKind.EOF, { line: -1, column: -1 });
		}
		return this._token;
	}

	/**
	 * カーソル位置にあるトークンの種類が指定したトークンの種類と一致するかどうかを示す値を取得します。
	*/
	public is(kind: TokenKind | TokenKind[]): boolean {
		if (Array.isArray(kind)) {
			return kind.includes(this.getTokenKind());
		} else {
			return this.getTokenKind() === kind;
		}
	}

	/**
	 * カーソル位置にあるトークンに含まれる値を取得します。
	*/
	public getTokenValue(): string {
		return this.getToken().value!;
	}

	/**
	 * カーソル位置にあるトークンの種類を取得します。
	*/
	public getTokenKind(): TokenKind {
		return this.getToken().kind;
	}

	/**
	 * カーソル位置にあるトークンの位置情報を取得します。
	*/
	public getPos(): TokenPosition {
		return this.getToken().pos;
	}

	/**
	 * カーソル位置を次のトークンへ進めます。
	*/
	public next(): void {
		if (!this.eof) {
			this.index++;
		}
		this.load();
	}

	/**
	 * トークンの先読みを行います。カーソル位置は移動されません。
	*/
	public lookahead(offset: number): Token {
		if (this.index + offset < this.source.length) {
			return this.source[this.index + offset]!;
		} else {
			return TOKEN(TokenKind.EOF, { line: -1, column: -1 });
		}
	}

	/**
	 * カーソル位置にあるトークンの種類が指定したトークンの種類と一致することを確認します。
	 * 一致しなかった場合には文法エラーを発生させます。
	*/
	public expect(kind: TokenKind): void {
		if (!this.is(kind)) {
			throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[this.getTokenKind()]}`, this.getPos());
		}
	}

	private load(): void {
		if (this.eof) {
			this._token = TOKEN(TokenKind.EOF, { line: -1, column: -1 });
		} else {
			this._token = this.source[this.index]!;
		}
	}
}
