import { AiScriptSyntaxError } from '../error.js';
import { CharStream } from './streams/char-stream.js';
import { TOKEN, TokenKind } from './token.js';

import type { ITokenStream } from './streams/token-stream.js';
import type { Token } from './token.js';

const spaceChars = [' ', '\t'];
const lineBreakChars = ['\r', '\n'];
const digit = /^[0-9]$/;
const wordChar = /^[A-Za-z0-9_]$/;

/**
 * 入力文字列からトークンを読み取るクラス
*/
export class Scanner implements ITokenStream {
	private stream: CharStream;
	private _tokens: Token[] = [];
	private firstRead: boolean;

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
		this.firstRead = true;
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

		// 現在のトークンがEOFだったら次のトークンに進まない
		if (this._tokens[0]!.kind === TokenKind.EOF) {
			return;
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
		let hasLeftSpacing = false;
		let lineBegin = false;

		if (this.firstRead) {
			lineBegin = true;
			this.firstRead = false;
		}

		while (true) {
			if (this.stream.eof) {
				token = TOKEN(TokenKind.EOF, { hasLeftSpacing, lineBegin });
				break;
			}
			// skip spasing
			if (spaceChars.includes(this.stream.char)) {
				this.stream.next();
				hasLeftSpacing = true;
				continue;
			}
			if (lineBreakChars.includes(this.stream.char)) {
				this.stream.next();
				hasLeftSpacing = true;
				lineBegin = true;
				continue;
			}
			switch (this.stream.char) {
				case '!': {
					this.stream.next();
					if ((this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.NotEq, { hasLeftSpacing, lineBegin });
					} else {
						token = TOKEN(TokenKind.Not, { hasLeftSpacing, lineBegin });
					}
					break;
				}
				case '"':
				case '\'': {
					token = this.readStringLiteral(hasLeftSpacing, lineBegin);
					break;
				}
				case '#': {
					this.stream.next();
					if ((this.stream.char as string) === '#') {
						this.stream.next();
						if ((this.stream.char as string) === '#') {
							this.stream.next();
							token = TOKEN(TokenKind.Sharp3, { hasLeftSpacing, lineBegin });
						}
					} else if ((this.stream.char as string) === '[') {
						this.stream.next();
						token = TOKEN(TokenKind.OpenSharpBracket, { hasLeftSpacing, lineBegin });
					} else {
						token = TOKEN(TokenKind.Sharp, { hasLeftSpacing, lineBegin });
					}
					break;
				}
				case '%': {
					this.stream.next();
					token = TOKEN(TokenKind.Percent, { hasLeftSpacing, lineBegin });
					break;
				}
				case '&': {
					this.stream.next();
					if ((this.stream.char as string) === '&') {
						this.stream.next();
						token = TOKEN(TokenKind.And2, { hasLeftSpacing, lineBegin });
					}
					break;
				}
				case '(': {
					this.stream.next();
					token = TOKEN(TokenKind.OpenParen, { hasLeftSpacing, lineBegin });
					break;
				}
				case ')': {
					this.stream.next();
					token = TOKEN(TokenKind.CloseParen, { hasLeftSpacing, lineBegin });
					break;
				}
				case '*': {
					this.stream.next();
					token = TOKEN(TokenKind.Asterisk, { hasLeftSpacing, lineBegin });
					break;
				}
				case '+': {
					this.stream.next();
					if ((this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.PlusEq, { hasLeftSpacing, lineBegin });
					} else {
						token = TOKEN(TokenKind.Plus, { hasLeftSpacing, lineBegin });
					}
					break;
				}
				case ',': {
					this.stream.next();
					token = TOKEN(TokenKind.Comma, { hasLeftSpacing, lineBegin });
					break;
				}
				case '-': {
					this.stream.next();
					if ((this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.MinusEq, { hasLeftSpacing, lineBegin });
					} else {
						token = TOKEN(TokenKind.Minus, { hasLeftSpacing, lineBegin });
					}
					break;
				}
				case '.': {
					this.stream.next();
					token = TOKEN(TokenKind.Dot, { hasLeftSpacing, lineBegin });
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
						token = TOKEN(TokenKind.Slash, { hasLeftSpacing, lineBegin });
					}
					break;
				}
				case ':': {
					this.stream.next();
					if ((this.stream.char as string) === ':') {
						this.stream.next();
						token = TOKEN(TokenKind.Colon2, { hasLeftSpacing, lineBegin });
					} else {
						token = TOKEN(TokenKind.Colon, { hasLeftSpacing, lineBegin });
					}
					break;
				}
				case ';': {
					this.stream.next();
					token = TOKEN(TokenKind.SemiColon, { hasLeftSpacing, lineBegin });
					break;
				}
				case '<': {
					this.stream.next();
					if ((this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.LtEq, { hasLeftSpacing, lineBegin });
					} else if ((this.stream.char as string) === ':') {
						this.stream.next();
						token = TOKEN(TokenKind.Out, { hasLeftSpacing, lineBegin });
					} else {
						token = TOKEN(TokenKind.Lt, { hasLeftSpacing, lineBegin });
					}
					break;
				}
				case '=': {
					this.stream.next();
					if ((this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.Eq2, { hasLeftSpacing, lineBegin });
					} else if ((this.stream.char as string) === '>') {
						this.stream.next();
						token = TOKEN(TokenKind.Arrow, { hasLeftSpacing, lineBegin });
					} else {
						token = TOKEN(TokenKind.Eq, { hasLeftSpacing, lineBegin });
					}
					break;
				}
				case '>': {
					this.stream.next();
					if ((this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.GtEq, { hasLeftSpacing, lineBegin });
					} else {
						token = TOKEN(TokenKind.Gt, { hasLeftSpacing, lineBegin });
					}
					break;
				}
				case '@': {
					this.stream.next();
					token = TOKEN(TokenKind.At, { hasLeftSpacing, lineBegin });
					break;
				}
				case '[': {
					this.stream.next();
					token = TOKEN(TokenKind.OpenBracket, { hasLeftSpacing, lineBegin });
					break;
				}
				case ']': {
					this.stream.next();
					token = TOKEN(TokenKind.CloseBracket, { hasLeftSpacing, lineBegin });
					break;
				}
				case '^': {
					this.stream.next();
					token = TOKEN(TokenKind.Hat, { hasLeftSpacing, lineBegin });
					break;
				}
				case '`': {
					this.stream.next();
					token = this.readTemplate(hasLeftSpacing, lineBegin);
					break;
				}
				case '{': {
					this.stream.next();
					token = TOKEN(TokenKind.OpenBrace, { hasLeftSpacing, lineBegin });
					break;
				}
				case '|': {
					this.stream.next();
					if ((this.stream.char as string) === '|') {
						this.stream.next();
						token = TOKEN(TokenKind.Or2, { hasLeftSpacing, lineBegin });
					}
					break;
				}
				case '}': {
					this.stream.next();
					token = TOKEN(TokenKind.CloseBrace, { hasLeftSpacing, lineBegin });
					break;
				}
			}
			if (token == null) {
				const digitToken = this.tryReadDigits(hasLeftSpacing, lineBegin);
				if (digitToken) {
					token = digitToken;
					break;
				}
				const wordToken = this.tryReadWord(hasLeftSpacing, lineBegin);
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

	private tryReadWord(hasLeftSpacing: boolean, lineBegin: boolean): Token | undefined {
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
				return TOKEN(TokenKind.NullKeyword, { hasLeftSpacing, lineBegin });
			}
			case 'true': {
				return TOKEN(TokenKind.TrueKeyword, { hasLeftSpacing, lineBegin });
			}
			case 'false': {
				return TOKEN(TokenKind.FalseKeyword, { hasLeftSpacing, lineBegin });
			}
			case 'each': {
				return TOKEN(TokenKind.EachKeyword, { hasLeftSpacing, lineBegin });
			}
			case 'for': {
				return TOKEN(TokenKind.ForKeyword, { hasLeftSpacing, lineBegin });
			}
			case 'loop': {
				return TOKEN(TokenKind.LoopKeyword, { hasLeftSpacing, lineBegin });
			}
			case 'break': {
				return TOKEN(TokenKind.BreakKeyword, { hasLeftSpacing, lineBegin });
			}
			case 'continue': {
				return TOKEN(TokenKind.ContinueKeyword, { hasLeftSpacing, lineBegin });
			}
			case 'match': {
				return TOKEN(TokenKind.MatchKeyword, { hasLeftSpacing, lineBegin });
			}
			case 'case': {
				return TOKEN(TokenKind.CaseKeyword, { hasLeftSpacing, lineBegin });
			}
			case 'default': {
				return TOKEN(TokenKind.DefaultKeyword, { hasLeftSpacing, lineBegin });
			}
			case 'if': {
				return TOKEN(TokenKind.IfKeyword, { hasLeftSpacing, lineBegin });
			}
			case 'elif': {
				return TOKEN(TokenKind.ElifKeyword, { hasLeftSpacing, lineBegin });
			}
			case 'else': {
				return TOKEN(TokenKind.ElseKeyword, { hasLeftSpacing, lineBegin });
			}
			case 'return': {
				return TOKEN(TokenKind.ReturnKeyword, { hasLeftSpacing, lineBegin });
			}
			case 'eval': {
				return TOKEN(TokenKind.EvalKeyword, { hasLeftSpacing, lineBegin });
			}
			case 'var': {
				return TOKEN(TokenKind.VarKeyword, { hasLeftSpacing, lineBegin });
			}
			case 'let': {
				return TOKEN(TokenKind.LetKeyword, { hasLeftSpacing, lineBegin });
			}
			case 'exists': {
				return TOKEN(TokenKind.ExistsKeyword, { hasLeftSpacing, lineBegin });
			}
			default: {
				return TOKEN(TokenKind.Identifier, { hasLeftSpacing, lineBegin, value });
			}
		}
	}

	private tryReadDigits(hasLeftSpacing: boolean, lineBegin: boolean): Token | undefined {
		// TODO: float number
		let value = '';
		while (!this.stream.eof && digit.test(this.stream.char)) {
			value += this.stream.char;
			this.stream.next();
		}
		if (value.length === 0) {
			return;
		}
		return TOKEN(TokenKind.NumberLiteral, { hasLeftSpacing, lineBegin, value });
	}

	private readStringLiteral(hasLeftSpacing: boolean, lineBegin: boolean): Token {
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
		return TOKEN(TokenKind.StringLiteral, { hasLeftSpacing, lineBegin, value });
	}

	private readTemplate(hasLeftSpacing: boolean, lineBegin: boolean): Token {
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
							elements.push(TOKEN(TokenKind.TemplateStringElement, { hasLeftSpacing, lineBegin, value: buf }));
						}
						state = 'finish';
						break;
					}
					// 埋め込み式の開始
					if (this.stream.char === '{') {
						this.stream.next();
						if (buf.length > 0) {
							elements.push(TOKEN(TokenKind.TemplateStringElement, { hasLeftSpacing, lineBegin, value: buf }));
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
					if (spaceChars.includes(this.stream.char)) {
						this.stream.next();
						continue;
					}
					// 埋め込み式の終了
					if ((this.stream.char as string) === '}') {
						this.stream.next();
						elements.push(TOKEN(TokenKind.TemplateExprElement, { hasLeftSpacing, lineBegin, children: tokenBuf }));
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

		return TOKEN(TokenKind.Template, { hasLeftSpacing, lineBegin, children: elements });
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
