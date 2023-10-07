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

		while (true) {
			if (this.stream.eof) {
				token = TOKEN(TokenKind.EOF, { hasLeftSpacing });
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
				token = TOKEN(TokenKind.NewLine, { hasLeftSpacing });
				return token;
			}
			switch (this.stream.char) {
				case '!': {
					this.stream.next();
					if ((this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.NotEq, { hasLeftSpacing });
					} else {
						token = TOKEN(TokenKind.Not, { hasLeftSpacing });
					}
					break;
				}
				case '"':
				case '\'': {
					token = this.readStringLiteral(hasLeftSpacing);
					break;
				}
				case '#': {
					this.stream.next();
					if ((this.stream.char as string) === '#') {
						this.stream.next();
						if ((this.stream.char as string) === '#') {
							this.stream.next();
							token = TOKEN(TokenKind.Sharp3, { hasLeftSpacing });
						}
					} else if ((this.stream.char as string) === '[') {
						this.stream.next();
						token = TOKEN(TokenKind.OpenSharpBracket, { hasLeftSpacing });
					} else {
						token = TOKEN(TokenKind.Sharp, { hasLeftSpacing });
					}
					break;
				}
				case '%': {
					this.stream.next();
					token = TOKEN(TokenKind.Percent, { hasLeftSpacing });
					break;
				}
				case '&': {
					this.stream.next();
					if ((this.stream.char as string) === '&') {
						this.stream.next();
						token = TOKEN(TokenKind.And2, { hasLeftSpacing });
					}
					break;
				}
				case '(': {
					this.stream.next();
					token = TOKEN(TokenKind.OpenParen, { hasLeftSpacing });
					break;
				}
				case ')': {
					this.stream.next();
					token = TOKEN(TokenKind.CloseParen, { hasLeftSpacing });
					break;
				}
				case '*': {
					this.stream.next();
					token = TOKEN(TokenKind.Asterisk, { hasLeftSpacing });
					break;
				}
				case '+': {
					this.stream.next();
					if ((this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.PlusEq, { hasLeftSpacing });
					} else {
						token = TOKEN(TokenKind.Plus, { hasLeftSpacing });
					}
					break;
				}
				case ',': {
					this.stream.next();
					token = TOKEN(TokenKind.Comma, { hasLeftSpacing });
					break;
				}
				case '-': {
					this.stream.next();
					if ((this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.MinusEq, { hasLeftSpacing });
					} else {
						token = TOKEN(TokenKind.Minus, { hasLeftSpacing });
					}
					break;
				}
				case '.': {
					this.stream.next();
					token = TOKEN(TokenKind.Dot, { hasLeftSpacing });
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
						token = TOKEN(TokenKind.Slash, { hasLeftSpacing });
					}
					break;
				}
				case ':': {
					this.stream.next();
					if ((this.stream.char as string) === ':') {
						this.stream.next();
						token = TOKEN(TokenKind.Colon2, { hasLeftSpacing });
					} else {
						token = TOKEN(TokenKind.Colon, { hasLeftSpacing });
					}
					break;
				}
				case ';': {
					this.stream.next();
					token = TOKEN(TokenKind.SemiColon, { hasLeftSpacing });
					break;
				}
				case '<': {
					this.stream.next();
					if ((this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.LtEq, { hasLeftSpacing });
					} else if ((this.stream.char as string) === ':') {
						this.stream.next();
						token = TOKEN(TokenKind.Out, { hasLeftSpacing });
					} else {
						token = TOKEN(TokenKind.Lt, { hasLeftSpacing });
					}
					break;
				}
				case '=': {
					this.stream.next();
					if ((this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.Eq2, { hasLeftSpacing });
					} else if ((this.stream.char as string) === '>') {
						this.stream.next();
						token = TOKEN(TokenKind.Arrow, { hasLeftSpacing });
					} else {
						token = TOKEN(TokenKind.Eq, { hasLeftSpacing });
					}
					break;
				}
				case '>': {
					this.stream.next();
					if ((this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.GtEq, { hasLeftSpacing });
					} else {
						token = TOKEN(TokenKind.Gt, { hasLeftSpacing });
					}
					break;
				}
				case '@': {
					this.stream.next();
					token = TOKEN(TokenKind.At, { hasLeftSpacing });
					break;
				}
				case '[': {
					this.stream.next();
					token = TOKEN(TokenKind.OpenBracket, { hasLeftSpacing });
					break;
				}
				case '\\': {
					this.stream.next();
					token = TOKEN(TokenKind.BackSlash, { hasLeftSpacing });
					break;
				}
				case ']': {
					this.stream.next();
					token = TOKEN(TokenKind.CloseBracket, { hasLeftSpacing });
					break;
				}
				case '^': {
					this.stream.next();
					token = TOKEN(TokenKind.Hat, { hasLeftSpacing });
					break;
				}
				case '`': {
					this.stream.next();
					token = this.readTemplate(hasLeftSpacing);
					break;
				}
				case '{': {
					this.stream.next();
					token = TOKEN(TokenKind.OpenBrace, { hasLeftSpacing });
					break;
				}
				case '|': {
					this.stream.next();
					if ((this.stream.char as string) === '|') {
						this.stream.next();
						token = TOKEN(TokenKind.Or2, { hasLeftSpacing });
					}
					break;
				}
				case '}': {
					this.stream.next();
					token = TOKEN(TokenKind.CloseBrace, { hasLeftSpacing });
					break;
				}
			}
			if (token == null) {
				const digitToken = this.tryReadDigits(hasLeftSpacing);
				if (digitToken) {
					token = digitToken;
					break;
				}
				const wordToken = this.tryReadWord(hasLeftSpacing);
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

	private tryReadWord(hasLeftSpacing: boolean): Token | undefined {
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
				return TOKEN(TokenKind.NullKeyword, { hasLeftSpacing });
			}
			case 'true': {
				return TOKEN(TokenKind.TrueKeyword, { hasLeftSpacing });
			}
			case 'false': {
				return TOKEN(TokenKind.FalseKeyword, { hasLeftSpacing });
			}
			case 'each': {
				return TOKEN(TokenKind.EachKeyword, { hasLeftSpacing });
			}
			case 'for': {
				return TOKEN(TokenKind.ForKeyword, { hasLeftSpacing });
			}
			case 'loop': {
				return TOKEN(TokenKind.LoopKeyword, { hasLeftSpacing });
			}
			case 'break': {
				return TOKEN(TokenKind.BreakKeyword, { hasLeftSpacing });
			}
			case 'continue': {
				return TOKEN(TokenKind.ContinueKeyword, { hasLeftSpacing });
			}
			case 'match': {
				return TOKEN(TokenKind.MatchKeyword, { hasLeftSpacing });
			}
			case 'case': {
				return TOKEN(TokenKind.CaseKeyword, { hasLeftSpacing });
			}
			case 'default': {
				return TOKEN(TokenKind.DefaultKeyword, { hasLeftSpacing });
			}
			case 'if': {
				return TOKEN(TokenKind.IfKeyword, { hasLeftSpacing });
			}
			case 'elif': {
				return TOKEN(TokenKind.ElifKeyword, { hasLeftSpacing });
			}
			case 'else': {
				return TOKEN(TokenKind.ElseKeyword, { hasLeftSpacing });
			}
			case 'return': {
				return TOKEN(TokenKind.ReturnKeyword, { hasLeftSpacing });
			}
			case 'eval': {
				return TOKEN(TokenKind.EvalKeyword, { hasLeftSpacing });
			}
			case 'var': {
				return TOKEN(TokenKind.VarKeyword, { hasLeftSpacing });
			}
			case 'let': {
				return TOKEN(TokenKind.LetKeyword, { hasLeftSpacing });
			}
			case 'exists': {
				return TOKEN(TokenKind.ExistsKeyword, { hasLeftSpacing });
			}
			default: {
				return TOKEN(TokenKind.Identifier, { hasLeftSpacing, value });
			}
		}
	}

	private tryReadDigits(hasLeftSpacing: boolean): Token | undefined {
		let wholeNumber = '';
		let fractional = '';
		while (!this.stream.eof && digit.test(this.stream.char)) {
			wholeNumber += this.stream.char;
			this.stream.next();
		}
		if (wholeNumber.length === 0) {
			return;
		}
		if (!this.stream.eof && this.stream.char === '.') {
			this.stream.next();
			while (!this.stream.eof && digit.test(this.stream.char)) {
				fractional += this.stream.char;
				this.stream.next();
			}
			if (fractional.length === 0) {
				throw new AiScriptSyntaxError('digit expected');
			}
		}
		let value;
		if (fractional.length > 0) {
			value = wholeNumber + '.' + fractional;
		} else {
			value = wholeNumber;
		}
		return TOKEN(TokenKind.NumberLiteral, { hasLeftSpacing, value });
	}

	private readStringLiteral(hasLeftSpacing: boolean): Token {
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
		return TOKEN(TokenKind.StringLiteral, { hasLeftSpacing, value });
	}

	private readTemplate(hasLeftSpacing: boolean): Token {
		const elements: Token[] = [];
		let buf = '';
		let tokenBuf: Token[] = [];
		let state: 'string' | 'escape' | 'expr' | 'finish' = 'string';

		while (state !== 'finish') {
			switch (state) {
				case 'string': {
					// テンプレートの終了が無いままEOFに達した
					if (this.stream.eof) {
						throw new AiScriptSyntaxError('unexpected EOF');
					}
					// エスケープ
					if (this.stream.char === '\\') {
						this.stream.next();
						state = 'escape';
						break;
					}
					// テンプレートの終了
					if (this.stream.char === '`') {
						this.stream.next();
						if (buf.length > 0) {
							elements.push(TOKEN(TokenKind.TemplateStringElement, { hasLeftSpacing, value: buf }));
						}
						state = 'finish';
						break;
					}
					// 埋め込み式の開始
					if (this.stream.char === '{') {
						this.stream.next();
						if (buf.length > 0) {
							elements.push(TOKEN(TokenKind.TemplateStringElement, { hasLeftSpacing, value: buf }));
							buf = '';
						}
						state = 'expr';
						break;
					}
					buf += this.stream.char;
					this.stream.next();
					break;
				}
				case 'escape': {
					// エスケープ対象の文字が無いままEOFに達した
					if (this.stream.eof) {
						throw new AiScriptSyntaxError('unexpected EOF');
					}
					// 普通の文字として取り込み
					buf += this.stream.char;
					this.stream.next();
					// 通常の文字列に戻る
					state = 'string';
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
						elements.push(TOKEN(TokenKind.TemplateExprElement, { hasLeftSpacing, children: tokenBuf }));
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

		return TOKEN(TokenKind.Template, { hasLeftSpacing, children: elements });
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
