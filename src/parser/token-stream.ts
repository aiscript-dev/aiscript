import { AiScriptSyntaxError } from '../error.js';
import { TOKEN, TokenKind } from './token.js';
import type { Token } from './token.js';

const spacingChars = [' ', '\t', '\r', '\n'];
const digit = /^[0-9]$/;
const wordChar = /^[A-Za-z0-9_]$/;

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
		} else {
			this.char = this.source[this.index];
		}
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
		// read a word
		let word = '';
		while (this.char != null && wordChar.test(this.char)) {
			word += this.char;
			this.nextChar();
		}
		if (word.length === 0) {
			return false;
		}
		// check word kind
		switch (word) {
			case 'null': {
				this.token = TOKEN(TokenKind.NullKeyword);
				break;
			}
			case 'true': {
				this.token = TOKEN(TokenKind.TrueKeyword);
				break;
			}
			case 'false': {
				this.token = TOKEN(TokenKind.FalseKeyword);
				break;
			}
			case 'each': {
				this.token = TOKEN(TokenKind.EachKeyword);
				break;
			}
			case 'for': {
				this.token = TOKEN(TokenKind.ForKeyword);
				break;
			}
			case 'loop': {
				this.token = TOKEN(TokenKind.LoopKeyword);
				break;
			}
			case 'break': {
				this.token = TOKEN(TokenKind.BreakKeyword);
				break;
			}
			case 'continue': {
				this.token = TOKEN(TokenKind.ContinueKeyword);
				break;
			}
			case 'match': {
				this.token = TOKEN(TokenKind.MatchKeyword);
				break;
			}
			case 'if': {
				this.token = TOKEN(TokenKind.IfKeyword);
				break;
			}
			case 'elif': {
				this.token = TOKEN(TokenKind.ElifKeyword);
				break;
			}
			case 'else': {
				this.token = TOKEN(TokenKind.ElseKeyword);
				break;
			}
			case 'return': {
				this.token = TOKEN(TokenKind.ReturnKeyword);
				break;
			}
			case 'eval': {
				this.token = TOKEN(TokenKind.EvalKeyword);
				break;
			}
			case 'var': {
				this.token = TOKEN(TokenKind.VarKeyword);
				break;
			}
			case 'let': {
				this.token = TOKEN(TokenKind.LetKeyword);
				break;
			}
			case 'exists': {
				this.token = TOKEN(TokenKind.ExistsKeyword);
				break;
			}
			default: {
				this.token = TOKEN(TokenKind.Identifier, word);
				break;
			}
		}
		return true;
	}

	private readDigits(): boolean {
		let digits = '';
		while (this.char != null && digit.test(this.char)) {
			digits += this.char;
			this.nextChar();
		}
		if (digits.length === 0) {
			return false;
		}
		this.token = TOKEN(TokenKind.NumberLiteral, digits);
		return true;
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
				case '!': {
					this.token = TOKEN(TokenKind.Not);
					this.nextChar();
					break;
				}
				case '#': {
					this.token = TOKEN(TokenKind.Sharp);
					this.nextChar();
					break;
				}
				case '%': {
					this.token = TOKEN(TokenKind.Percent);
					this.nextChar();
					break;
				}
				case '&': {
					this.nextChar();
					if (this.char === '&') {
						this.token = TOKEN(TokenKind.And2);
						this.nextChar();
					} else {
						match = false;
					}
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
				case '*': {
					this.token = TOKEN(TokenKind.Asterisk);
					this.nextChar();
					break;
				}
				case '+': {
					this.token = TOKEN(TokenKind.Plus);
					this.nextChar();
					break;
				}
				case ',': {
					this.token = TOKEN(TokenKind.Comma);
					this.nextChar();
					break;
				}
				case '-': {
					this.token = TOKEN(TokenKind.Minus);
					this.nextChar();
					break;
				}
				case '.': {
					this.token = TOKEN(TokenKind.Dot);
					this.nextChar();
					break;
				}
				case '/': {
					this.token = TOKEN(TokenKind.Slash);
					this.nextChar();
					break;
				}
				case ':': {
					this.token = TOKEN(TokenKind.Colon);
					this.nextChar();
					break;
				}
				case ';': {
					this.token = TOKEN(TokenKind.SemiColon);
					this.nextChar();
					break;
				}
				case '<': {
					this.token = TOKEN(TokenKind.Lt);
					this.nextChar();
					break;
				}
				case '=': {
					this.token = TOKEN(TokenKind.Eq);
					this.nextChar();
					break;
				}
				case '>': {
					this.token = TOKEN(TokenKind.Gt);
					this.nextChar();
					break;
				}
				case '@': {
					this.token = TOKEN(TokenKind.At);
					this.nextChar();
					break;
				}
				case '[': {
					this.token = TOKEN(TokenKind.OpenBracket);
					this.nextChar();
					break;
				}
				case ']': {
					this.token = TOKEN(TokenKind.CloseBracket);
					this.nextChar();
					break;
				}
				case '^': {
					this.token = TOKEN(TokenKind.Hat);
					this.nextChar();
					break;
				}
				case '{': {
					this.token = TOKEN(TokenKind.OpenBrace);
					this.nextChar();
					break;
				}
				case '|': {
					this.nextChar();
					if (this.char === '|') {
						this.token = TOKEN(TokenKind.Or2);
						this.nextChar();
					} else {
						match = false;
					}
					break;
				}
				case '}': {
					this.token = TOKEN(TokenKind.CloseBrace);
					this.nextChar();
					break;
				}
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
