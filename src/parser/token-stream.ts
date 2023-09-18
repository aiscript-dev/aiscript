import { AiScriptSyntaxError } from '../error.js';
import { TOKEN, TokenKind } from './token.js';
import type { Token } from './token.js';

const spacingChars = [' ', '\t', '\r', '\n'];
const digit = /^[0-9]$/;
const wordChar = /^[A-Za-z0-9_]$/;

export class TokenStream {
	private source: string;
	private _token?: Token;
	private index: number;
	private char?: string;

	public constructor(source: string) {
		this.source = source;
		this.index = 0;
	}

	public init() {
		this.loadChar();
		this.next();
	}

	public kindOf(kind: TokenKind): boolean {
		return (this.token.kind === kind);
	}

	public expect(kind: TokenKind): void {
		if (!this.kindOf(kind)) {
			throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[this.token.kind]}`);
		}
	}

	public consumeAs(kind: TokenKind): void {
		this.expect(kind);
		this.next();
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

	public get token(): Token {
		if (this._token == null) {
			throw new Error('invalid operation: token is not read yet');
		}
		return this._token;
	}

	public next(): void {
		while (true) {
			// EOF terminated
			if (this.char == null) {
				this._token = TOKEN(TokenKind.EOF);
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
					this.nextChar();
					if ((this.char as string) === '=') {
						this.nextChar();
						this._token = TOKEN(TokenKind.NotEq);
					} else {
						this._token = TOKEN(TokenKind.Not);
					}
					break;
				}
				case '#': {
					this.nextChar();
					if ((this.char as string) === '#') {
						this.nextChar();
						if ((this.char as string) === '#') {
							this.nextChar();
							this._token = TOKEN(TokenKind.Sharp3);
						} else {
							match = false;
						}
					} else if ((this.char as string) === '[') {
						this.nextChar();
						this._token = TOKEN(TokenKind.OpenSharpBracket);
					} else {
						this._token = TOKEN(TokenKind.Sharp);
					}
					break;
				}
				case '%': {
					this.nextChar();
					this._token = TOKEN(TokenKind.Percent);
					break;
				}
				case '&': {
					this.nextChar();
					if ((this.char as string) === '&') {
						this.nextChar();
						this._token = TOKEN(TokenKind.And2);
					} else {
						match = false;
					}
					break;
				}
				case '(': {
					this.nextChar();
					this._token = TOKEN(TokenKind.OpenParen);
					break;
				}
				case ')': {
					this.nextChar();
					this._token = TOKEN(TokenKind.CloseParen);
					break;
				}
				case '*': {
					this.nextChar();
					this._token = TOKEN(TokenKind.Asterisk);
					break;
				}
				case '+': {
					this.nextChar();
					if ((this.char as string) === '=') {
						this.nextChar();
						this._token = TOKEN(TokenKind.PlusEq);
					} else {
						this._token = TOKEN(TokenKind.Plus);
					}
					break;
				}
				case ',': {
					this.nextChar();
					this._token = TOKEN(TokenKind.Comma);
					break;
				}
				case '-': {
					this.nextChar();
					if ((this.char as string) === '=') {
						this.nextChar();
						this._token = TOKEN(TokenKind.MinusEq);
					} else {
						this._token = TOKEN(TokenKind.Minus);
					}
					break;
				}
				case '.': {
					this.nextChar();
					this._token = TOKEN(TokenKind.Dot);
					break;
				}
				case '/': {
					this.nextChar();
					if ((this.char as string) === '*') {
						this.nextChar();
						this.skipCommentRange();
						continue;
					} else if ((this.char as string) === '/') {
						this.nextChar();
						this.skipCommentLine();
						continue;
					} else {
						this._token = TOKEN(TokenKind.Slash);
					}
					break;
				}
				case ':': {
					this.nextChar();
					if ((this.char as string) === ':') {
						this.nextChar();
						this._token = TOKEN(TokenKind.Colon2);
					} else {
						this._token = TOKEN(TokenKind.Colon);
					}
					break;
				}
				case ';': {
					this.nextChar();
					this._token = TOKEN(TokenKind.SemiColon);
					break;
				}
				case '<': {
					this.nextChar();
					if ((this.char as string) === '=') {
						this.nextChar();
						this._token = TOKEN(TokenKind.LtEq);
					} else if ((this.char as string) === ':') {
						this.nextChar();
						this._token = TOKEN(TokenKind.Out);
					} else {
						this._token = TOKEN(TokenKind.Lt);
					}
					break;
				}
				case '=': {
					this.nextChar();
					if ((this.char as string) === '=') {
						this.nextChar();
						this._token = TOKEN(TokenKind.Eq2);
					} else if ((this.char as string) === '>') {
						this.nextChar();
						this._token = TOKEN(TokenKind.Arrow);
					} else {
						this._token = TOKEN(TokenKind.Eq);
					}
					break;
				}
				case '>': {
					this.nextChar();
					if ((this.char as string) === '=') {
						this.nextChar();
						this._token = TOKEN(TokenKind.GtEq);
					} else {
						this._token = TOKEN(TokenKind.Gt);
					}
					break;
				}
				case '@': {
					this.nextChar();
					this._token = TOKEN(TokenKind.At);
					break;
				}
				case '[': {
					this.nextChar();
					this._token = TOKEN(TokenKind.OpenBracket);
					break;
				}
				case ']': {
					this.nextChar();
					this._token = TOKEN(TokenKind.CloseBracket);
					break;
				}
				case '^': {
					this.nextChar();
					this._token = TOKEN(TokenKind.Hat);
					break;
				}
				case '{': {
					this.nextChar();
					this._token = TOKEN(TokenKind.OpenBrace);
					break;
				}
				case '|': {
					this.nextChar();
					if ((this.char as string) === '|') {
						this.nextChar();
						this._token = TOKEN(TokenKind.Or2);
					} else {
						match = false;
					}
					break;
				}
				case '}': {
					this.nextChar();
					this._token = TOKEN(TokenKind.CloseBrace);
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
				this._token = TOKEN(TokenKind.NullKeyword);
				break;
			}
			case 'true': {
				this._token = TOKEN(TokenKind.TrueKeyword);
				break;
			}
			case 'false': {
				this._token = TOKEN(TokenKind.FalseKeyword);
				break;
			}
			case 'each': {
				this._token = TOKEN(TokenKind.EachKeyword);
				break;
			}
			case 'for': {
				this._token = TOKEN(TokenKind.ForKeyword);
				break;
			}
			case 'loop': {
				this._token = TOKEN(TokenKind.LoopKeyword);
				break;
			}
			case 'break': {
				this._token = TOKEN(TokenKind.BreakKeyword);
				break;
			}
			case 'continue': {
				this._token = TOKEN(TokenKind.ContinueKeyword);
				break;
			}
			case 'match': {
				this._token = TOKEN(TokenKind.MatchKeyword);
				break;
			}
			case 'if': {
				this._token = TOKEN(TokenKind.IfKeyword);
				break;
			}
			case 'elif': {
				this._token = TOKEN(TokenKind.ElifKeyword);
				break;
			}
			case 'else': {
				this._token = TOKEN(TokenKind.ElseKeyword);
				break;
			}
			case 'return': {
				this._token = TOKEN(TokenKind.ReturnKeyword);
				break;
			}
			case 'eval': {
				this._token = TOKEN(TokenKind.EvalKeyword);
				break;
			}
			case 'var': {
				this._token = TOKEN(TokenKind.VarKeyword);
				break;
			}
			case 'let': {
				this._token = TOKEN(TokenKind.LetKeyword);
				break;
			}
			case 'exists': {
				this._token = TOKEN(TokenKind.ExistsKeyword);
				break;
			}
			default: {
				this._token = TOKEN(TokenKind.Identifier, word);
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
		this._token = TOKEN(TokenKind.NumberLiteral, digits);
		return true;
	}

	private skipCommentLine() {
		while (true) {
			if (this.char == null) {
				break;
			}
			if (this.char === '\n') {
				this.nextChar();
				break;
			}
			this.nextChar();
		}
	}

	private skipCommentRange() {
		while (true) {
			if (this.char == null) {
				break;
			}
			if (this.char === '*') {
				this.nextChar();
				if ((this.char as string) === '/') {
					this.nextChar();
					break;
				}
				continue;
			}
			this.nextChar();
		}
	}
}
