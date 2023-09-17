import { AiScriptSyntaxError } from '../error.js';
import { TOKEN, Token, TokenKind } from './token.js';

const spacingChars = [' ', '\t', '\r', '\n'];

export class TokenStream {
	private source: string;
	private token?: Token;
	private index: number;
	private char?: string;

	public constructor(source: string) {
		this.source = source;
		this.index = 0;
		this.loadChar();
	}

	private get isEof(): boolean {
		return (this.index >= this.source.length);
	}

	private loadChar(): void {
		if (this.isEof) {
			this.char = undefined;
		}
		this.char = this.source[this.index];
	}

	private nextChar(): void {
		if (!this.isEof) {
			this.index++;
		}
		this.loadChar();
	}

	/** readメソッドで読み取ったトークンを取得します。 */
	public get current(): Token {
		if (this.token == null) {
			throw new Error('invalid operation: token is not read yet');
		}
		return this.token;
	}

	private readWord(): boolean {
		// TODO
		return false;
	}

	private readDigits(): boolean {
		// TODO
		return false;
	}

	/** トークンを読み取ります。 */
	public read(): void {
		while (true) {
			// EOF terminated
			if (this.char == null) {
				this.token = TOKEN(TokenKind.EOF);
				break;
			}
			// skip spasing
			if (spacingChars.includes(this.char)) {
				this.nextChar();
				continue;
			}
			let match = true;
			switch (this.char) {
				case '@': {
					this.token = TOKEN(TokenKind.At);
					this.nextChar();
					break;
				}
				case '(': {
					this.token = TOKEN(TokenKind.OpenParen);
					this.nextChar();
					break;
				}
				case ')': {
					this.token = TOKEN(TokenKind.CloseParen);
					this.nextChar();
					break;
				}
				case '{': {
					this.token = TOKEN(TokenKind.OpenBrace);
					this.nextChar();
					break;
				}
				case '}': {
					this.token = TOKEN(TokenKind.CloseBrace);
					this.nextChar();
					break;
				}
				// TODO
				default: {
					match = false;
				}
			}
			if (!match) {
				if (this.readDigits()) {
					break;
				}
				if (this.readWord()) {
					break;
				}
				throw new AiScriptSyntaxError(`invalid character: "${this.char}"`);
			}
			break;
		}
	}
}
