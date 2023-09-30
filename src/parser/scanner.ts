import { AiScriptSyntaxError } from '../error.js';
import { CharStream } from './streams/char-stream.js';
import { TOKEN, TokenKind } from './token.js';

import type { ITokenStream } from './streams/token-stream.js';
import type { Token } from './token.js';

const spacingChars = [' ', '\t', '\r', '\n'];
const digit = /^[0-9]$/;
const wordChar = /^[A-Za-z0-9_]$/;

/**
 * 入力文字列からトークンを読み取るクラス
*/
export class Scanner implements ITokenStream {
	private stream: CharStream;
	private _tokens: Token[] = [];

	constructor(source: string)
	constructor(stream: CharStream)
	constructor(x: string | CharStream) {
		if (typeof x === 'string') {
			this.stream = new CharStream(x);
			this.stream.init();
		} else {
			this.stream = x;
		}
	}

	public init(): void {
		this._tokens.push(this.readToken());
	}

	public get eof(): boolean {
		return this.stream.eof;
	}

	public get token(): Token {
		if (this._tokens.length === 0) {
			throw new Error('scanner is not initialized yet');
		}
		return this._tokens[0]!;
	}

	public get kind(): TokenKind {
		return this.token.kind;
	}

	public next(): void {
		if (this._tokens.length === 0) {
			throw new Error('scanner is not initialized yet');
		}

		this._tokens.shift();

		if (this._tokens.length === 0) {
			this._tokens.push(this.readToken());
		}
	}

	public lookahead(offset: number): Token {
		if (this._tokens.length === 0) {
			throw new Error('scanner is not initialized yet');
		}

		while (this._tokens.length <= offset) {
			this._tokens.push(this.readToken());
		}

		return this._tokens[offset]!;
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

	private readToken(): Token {
		let token;
		let spaceSkipped = false;
		while (true) {
			if (this.stream.eof) {
				token = TOKEN(TokenKind.EOF, spaceSkipped);
				break;
			}
			// skip spasing
			if (spacingChars.includes(this.stream.char)) {
				this.stream.next();
				spaceSkipped = true;
				continue;
			}
			switch (this.stream.char) {
				case '!': {
					this.stream.next();
					if ((this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.NotEq, spaceSkipped);
					} else {
						token = TOKEN(TokenKind.Not, spaceSkipped);
					}
					break;
				}
				case '"': {
					token = this.readStringLiteral(spaceSkipped);
					break;
				}
				case '#': {
					this.stream.next();
					if ((this.stream.char as string) === '#') {
						this.stream.next();
						if ((this.stream.char as string) === '#') {
							this.stream.next();
							token = TOKEN(TokenKind.Sharp3, spaceSkipped);
						}
					} else if ((this.stream.char as string) === '[') {
						this.stream.next();
						token = TOKEN(TokenKind.OpenSharpBracket, spaceSkipped);
					} else {
						token = TOKEN(TokenKind.Sharp, spaceSkipped);
					}
					break;
				}
				case '%': {
					this.stream.next();
					token = TOKEN(TokenKind.Percent, spaceSkipped);
					break;
				}
				case '&': {
					this.stream.next();
					if ((this.stream.char as string) === '&') {
						this.stream.next();
						token = TOKEN(TokenKind.And2, spaceSkipped);
					}
					break;
				}
				case '(': {
					this.stream.next();
					token = TOKEN(TokenKind.OpenParen, spaceSkipped);
					break;
				}
				case ')': {
					this.stream.next();
					token = TOKEN(TokenKind.CloseParen, spaceSkipped);
					break;
				}
				case '*': {
					this.stream.next();
					token = TOKEN(TokenKind.Asterisk, spaceSkipped);
					break;
				}
				case '+': {
					this.stream.next();
					if ((this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.PlusEq, spaceSkipped);
					} else {
						token = TOKEN(TokenKind.Plus, spaceSkipped);
					}
					break;
				}
				case ',': {
					this.stream.next();
					token = TOKEN(TokenKind.Comma, spaceSkipped);
					break;
				}
				case '-': {
					this.stream.next();
					if ((this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.MinusEq, spaceSkipped);
					} else {
						token = TOKEN(TokenKind.Minus, spaceSkipped);
					}
					break;
				}
				case '.': {
					this.stream.next();
					token = TOKEN(TokenKind.Dot, spaceSkipped);
					break;
				}
				case '/': {
					this.stream.next();
					if ((this.stream.char as string) === '*') {
						this.stream.next();
						this.skipCommentRange();
						continue;
					} else if ((this.stream.char as string) === '/') {
						this.stream.next();
						this.skipCommentLine();
						continue;
					} else {
						token = TOKEN(TokenKind.Slash, spaceSkipped);
					}
					break;
				}
				case ':': {
					this.stream.next();
					if ((this.stream.char as string) === ':') {
						this.stream.next();
						token = TOKEN(TokenKind.Colon2, spaceSkipped);
					} else {
						token = TOKEN(TokenKind.Colon, spaceSkipped);
					}
					break;
				}
				case ';': {
					this.stream.next();
					token = TOKEN(TokenKind.SemiColon, spaceSkipped);
					break;
				}
				case '<': {
					this.stream.next();
					if ((this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.LtEq, spaceSkipped);
					} else if ((this.stream.char as string) === ':') {
						this.stream.next();
						token = TOKEN(TokenKind.Out, spaceSkipped);
					} else {
						token = TOKEN(TokenKind.Lt, spaceSkipped);
					}
					break;
				}
				case '=': {
					this.stream.next();
					if ((this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.Eq2, spaceSkipped);
					} else if ((this.stream.char as string) === '>') {
						this.stream.next();
						token = TOKEN(TokenKind.Arrow, spaceSkipped);
					} else {
						token = TOKEN(TokenKind.Eq, spaceSkipped);
					}
					break;
				}
				case '>': {
					this.stream.next();
					if ((this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.GtEq, spaceSkipped);
					} else {
						token = TOKEN(TokenKind.Gt, spaceSkipped);
					}
					break;
				}
				case '@': {
					this.stream.next();
					token = TOKEN(TokenKind.At, spaceSkipped);
					break;
				}
				case '[': {
					this.stream.next();
					token = TOKEN(TokenKind.OpenBracket, spaceSkipped);
					break;
				}
				case ']': {
					this.stream.next();
					token = TOKEN(TokenKind.CloseBracket, spaceSkipped);
					break;
				}
				case '^': {
					this.stream.next();
					token = TOKEN(TokenKind.Hat, spaceSkipped);
					break;
				}
				case '`': {
					this.stream.next();
					token = this.readTemplate(spaceSkipped);
					break;
				}
				case '{': {
					this.stream.next();
					token = TOKEN(TokenKind.OpenBrace, spaceSkipped);
					break;
				}
				case '|': {
					this.stream.next();
					if ((this.stream.char as string) === '|') {
						this.stream.next();
						token = TOKEN(TokenKind.Or2, spaceSkipped);
					}
					break;
				}
				case '}': {
					this.stream.next();
					token = TOKEN(TokenKind.CloseBrace, spaceSkipped);
					break;
				}
			}
			if (token == null) {
				const digitToken = this.tryReadDigits(spaceSkipped);
				if (digitToken) {
					token = digitToken;
					break;
				}
				const wordToken = this.tryReadWord(spaceSkipped);
				if (wordToken) {
					token = wordToken;
					break;
				}
				throw new AiScriptSyntaxError(`invalid character: "${this.stream.char}"`);
			}
			break;
		}
		return token;
	}

	private tryReadWord(spaceSkipped: boolean): Token | undefined {
		// read a word
		let value = '';
		while (!this.stream.eof && wordChar.test(this.stream.char)) {
			value += this.stream.char;
			this.stream.next();
		}
		if (value.length === 0) {
			return;
		}
		// check word kind
		switch (value) {
			case 'null': {
				return TOKEN(TokenKind.NullKeyword, spaceSkipped);
			}
			case 'true': {
				return TOKEN(TokenKind.TrueKeyword, spaceSkipped);
			}
			case 'false': {
				return TOKEN(TokenKind.FalseKeyword, spaceSkipped);
			}
			case 'each': {
				return TOKEN(TokenKind.EachKeyword, spaceSkipped);
			}
			case 'for': {
				return TOKEN(TokenKind.ForKeyword, spaceSkipped);
			}
			case 'loop': {
				return TOKEN(TokenKind.LoopKeyword, spaceSkipped);
			}
			case 'break': {
				return TOKEN(TokenKind.BreakKeyword, spaceSkipped);
			}
			case 'continue': {
				return TOKEN(TokenKind.ContinueKeyword, spaceSkipped);
			}
			case 'match': {
				return TOKEN(TokenKind.MatchKeyword, spaceSkipped);
			}
			case 'case': {
				return TOKEN(TokenKind.CaseKeyword, spaceSkipped);
			}
			case 'default': {
				return TOKEN(TokenKind.DefaultKeyword, spaceSkipped);
			}
			case 'if': {
				return TOKEN(TokenKind.IfKeyword, spaceSkipped);
			}
			case 'elif': {
				return TOKEN(TokenKind.ElifKeyword, spaceSkipped);
			}
			case 'else': {
				return TOKEN(TokenKind.ElseKeyword, spaceSkipped);
			}
			case 'return': {
				return TOKEN(TokenKind.ReturnKeyword, spaceSkipped);
			}
			case 'eval': {
				return TOKEN(TokenKind.EvalKeyword, spaceSkipped);
			}
			case 'var': {
				return TOKEN(TokenKind.VarKeyword, spaceSkipped);
			}
			case 'let': {
				return TOKEN(TokenKind.LetKeyword, spaceSkipped);
			}
			case 'exists': {
				return TOKEN(TokenKind.ExistsKeyword, spaceSkipped);
			}
			default: {
				return TOKEN(TokenKind.Identifier, spaceSkipped, { value });
			}
		}
	}

	private tryReadDigits(spaceSkipped: boolean): Token | undefined {
		// TODO: float number
		let value = '';
		while (!this.stream.eof && digit.test(this.stream.char)) {
			value += this.stream.char;
			this.stream.next();
		}
		if (value.length === 0) {
			return;
		}
		return TOKEN(TokenKind.NumberLiteral, spaceSkipped, { value });
	}

	private readStringLiteral(spaceSkipped: boolean): Token {
		let value = '';

		const literalMark = this.stream.char;
		this.stream.next();

		while (true) {
			if (this.stream.eof) {
				throw new AiScriptSyntaxError('unexpected EOF');
			}
			if (this.stream.char === literalMark) {
				this.stream.next();
				break;
			}
			value += this.stream.char;
			this.stream.next();
		}
		return TOKEN(TokenKind.StringLiteral, spaceSkipped, { value });
	}

	private readTemplate(spaceSkipped: boolean): Token {
		const elements: Token[] = [];
		let buf = '';
		let tokenBuf: Token[] = [];
		let state: 'string' | 'expr' | 'finish' = 'string';

		while (state !== 'finish') {
			switch (state) {
				case 'string': {
					// テンプレートの終了が無いままEOFに達した
					if (this.stream.eof) {
						throw new AiScriptSyntaxError('unexpected EOF');
					}
					// テンプレートの終了
					if (this.stream.char === '`') {
						this.stream.next();
						if (buf.length > 0) {
							elements.push(TOKEN(TokenKind.TemplateStringElement, spaceSkipped, { value: buf }));
						}
						state = 'finish';
						break;
					}
					// 埋め込み式の開始
					if (this.stream.char === '{') {
						this.stream.next();
						if (buf.length > 0) {
							elements.push(TOKEN(TokenKind.TemplateStringElement, spaceSkipped, { value: buf }));
							buf = '';
						}
						state = 'expr';
						break;
					}
					buf += this.stream.char;
					this.stream.next();
					break;
				}
				case 'expr': {
					// 埋め込み式の終端記号が無いままEOFに達した
					if (this.stream.eof) {
						throw new AiScriptSyntaxError('unexpected EOF');
					}
					// skip spasing
					if (spacingChars.includes(this.stream.char)) {
						this.stream.next();
						continue;
					}
					// 埋め込み式の終了
					if ((this.stream.char as string) === '}') {
						this.stream.next();
						elements.push(TOKEN(TokenKind.TemplateExprElement, spaceSkipped, { children: tokenBuf }));
						tokenBuf = [];
						state = 'string';
						break;
					}
					const token = this.readToken();
					tokenBuf.push(token);
					break;
				}
			}
		}

		return TOKEN(TokenKind.Template, spaceSkipped, { children: elements });
	}

	private skipCommentLine(): void {
		while (true) {
			if (this.stream.eof) {
				break;
			}
			if (this.stream.char === '\n') {
				this.stream.next();
				break;
			}
			this.stream.next();
		}
	}

	private skipCommentRange(): void {
		while (true) {
			if (this.stream.eof) {
				break;
			}
			if (this.stream.char === '*') {
				this.stream.next();
				if ((this.stream.char as string) === '/') {
					this.stream.next();
					break;
				}
				continue;
			}
			this.stream.next();
		}
	}
}
