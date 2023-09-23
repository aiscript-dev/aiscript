import { AiScriptSyntaxError } from '../error.js';
import { TOKEN, TokenKind } from './token.js';
import type { Token } from './token.js';

const spacingChars = [' ', '\t', '\r', '\n'];
const digit = /^[0-9]$/;
const wordChar = /^[A-Za-z0-9_]$/;

export interface ITokenStream {
	expect(kind: TokenKind): void;
	nextWith(kind: TokenKind): void;
	get token(): Token;
	get kind(): TokenKind;
	next(): void;
}

export class SourceReader implements ITokenStream {
	private source: string;
	private _token?: Token;
	private index: number;
	private char?: string;

	public constructor(source: string) {
		this.source = source;
		this.index = 0;
	}

	public init(): void {
		this.loadChar();
		this._token = this.nextToken();
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
			throw new Error('stream is not initialized yet');
		}
		return this._token;
	}

	public get kind(): TokenKind {
		return this.token.kind;
	}

	public next(): void {
		if (this._token == null) {
			throw new Error('stream is not initialized yet');
		}
		this._token = this.nextToken();
	}

	private nextToken(): Token {
		let token;
		while (true) {
			// EOF terminated
			if (this.char == null) {
				token = TOKEN(TokenKind.EOF);
				break;
			}
			// skip spasing
			if (spacingChars.includes(this.char)) {
				this.nextChar();
				continue;
			}
			switch (this.char) {
				case '!': {
					this.nextChar();
					if ((this.char as string) === '=') {
						this.nextChar();
						token = TOKEN(TokenKind.NotEq);
					} else {
						token = TOKEN(TokenKind.Not);
					}
					break;
				}
				case '"': {
					this.nextChar();
					token = this.readStringLiteral();
					break;
				}
				case '#': {
					this.nextChar();
					if ((this.char as string) === '#') {
						this.nextChar();
						if ((this.char as string) === '#') {
							this.nextChar();
							token = TOKEN(TokenKind.Sharp3);
						}
					} else if ((this.char as string) === '[') {
						this.nextChar();
						token = TOKEN(TokenKind.OpenSharpBracket);
					} else {
						token = TOKEN(TokenKind.Sharp);
					}
					break;
				}
				case '%': {
					this.nextChar();
					token = TOKEN(TokenKind.Percent);
					break;
				}
				case '&': {
					this.nextChar();
					if ((this.char as string) === '&') {
						this.nextChar();
						token = TOKEN(TokenKind.And2);
					}
					break;
				}
				case '(': {
					this.nextChar();
					token = TOKEN(TokenKind.OpenParen);
					break;
				}
				case ')': {
					this.nextChar();
					token = TOKEN(TokenKind.CloseParen);
					break;
				}
				case '*': {
					this.nextChar();
					token = TOKEN(TokenKind.Asterisk);
					break;
				}
				case '+': {
					this.nextChar();
					if ((this.char as string) === '=') {
						this.nextChar();
						token = TOKEN(TokenKind.PlusEq);
					} else {
						token = TOKEN(TokenKind.Plus);
					}
					break;
				}
				case ',': {
					this.nextChar();
					token = TOKEN(TokenKind.Comma);
					break;
				}
				case '-': {
					this.nextChar();
					if ((this.char as string) === '=') {
						this.nextChar();
						token = TOKEN(TokenKind.MinusEq);
					} else {
						token = TOKEN(TokenKind.Minus);
					}
					break;
				}
				case '.': {
					this.nextChar();
					token = TOKEN(TokenKind.Dot);
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
						token = TOKEN(TokenKind.Slash);
					}
					break;
				}
				case ':': {
					this.nextChar();
					if ((this.char as string) === ':') {
						this.nextChar();
						token = TOKEN(TokenKind.Colon2);
					} else {
						token = TOKEN(TokenKind.Colon);
					}
					break;
				}
				case ';': {
					this.nextChar();
					token = TOKEN(TokenKind.SemiColon);
					break;
				}
				case '<': {
					this.nextChar();
					if ((this.char as string) === '=') {
						this.nextChar();
						token = TOKEN(TokenKind.LtEq);
					} else if ((this.char as string) === ':') {
						this.nextChar();
						token = TOKEN(TokenKind.Out);
					} else {
						token = TOKEN(TokenKind.Lt);
					}
					break;
				}
				case '=': {
					this.nextChar();
					if ((this.char as string) === '=') {
						this.nextChar();
						token = TOKEN(TokenKind.Eq2);
					} else if ((this.char as string) === '>') {
						this.nextChar();
						token = TOKEN(TokenKind.Arrow);
					} else {
						token = TOKEN(TokenKind.Eq);
					}
					break;
				}
				case '>': {
					this.nextChar();
					if ((this.char as string) === '=') {
						this.nextChar();
						token = TOKEN(TokenKind.GtEq);
					} else {
						token = TOKEN(TokenKind.Gt);
					}
					break;
				}
				case '@': {
					this.nextChar();
					token = TOKEN(TokenKind.At);
					break;
				}
				case '[': {
					this.nextChar();
					token = TOKEN(TokenKind.OpenBracket);
					break;
				}
				case ']': {
					this.nextChar();
					token = TOKEN(TokenKind.CloseBracket);
					break;
				}
				case '^': {
					this.nextChar();
					token = TOKEN(TokenKind.Hat);
					break;
				}
				case '`': {
					this.nextChar();
					token = this.readTemplate();
					break;
				}
				case '{': {
					this.nextChar();
					token = TOKEN(TokenKind.OpenBrace);
					break;
				}
				case '|': {
					this.nextChar();
					if ((this.char as string) === '|') {
						this.nextChar();
						token = TOKEN(TokenKind.Or2);
					}
					break;
				}
				case '}': {
					this.nextChar();
					token = TOKEN(TokenKind.CloseBrace);
					break;
				}
			}
			if (token == null) {
				const digitToken = this.tryReadDigits();
				if (digitToken) {
					token = digitToken;
					break;
				}
				const wordToken = this.tryReadWord();
				if (wordToken) {
					token = wordToken;
					break;
				}
				throw new AiScriptSyntaxError(`invalid character: "${this.char}"`);
			}
			break;
		}
		return token;
	}

	private tryReadWord(): Token | undefined {
		// read a word
		let value = '';
		while (this.char != null && wordChar.test(this.char)) {
			value += this.char;
			this.nextChar();
		}
		if (value.length === 0) {
			return;
		}
		// check word kind
		switch (value) {
			case 'null': {
				return TOKEN(TokenKind.NullKeyword);
			}
			case 'true': {
				return TOKEN(TokenKind.TrueKeyword);
			}
			case 'false': {
				return TOKEN(TokenKind.FalseKeyword);
			}
			case 'each': {
				return TOKEN(TokenKind.EachKeyword);
			}
			case 'for': {
				return TOKEN(TokenKind.ForKeyword);
			}
			case 'loop': {
				return TOKEN(TokenKind.LoopKeyword);
			}
			case 'break': {
				return TOKEN(TokenKind.BreakKeyword);
			}
			case 'continue': {
				return TOKEN(TokenKind.ContinueKeyword);
			}
			case 'match': {
				return TOKEN(TokenKind.MatchKeyword);
			}
			case 'if': {
				return TOKEN(TokenKind.IfKeyword);
			}
			case 'elif': {
				return TOKEN(TokenKind.ElifKeyword);
			}
			case 'else': {
				return TOKEN(TokenKind.ElseKeyword);
			}
			case 'return': {
				return TOKEN(TokenKind.ReturnKeyword);
			}
			case 'eval': {
				return TOKEN(TokenKind.EvalKeyword);
			}
			case 'var': {
				return TOKEN(TokenKind.VarKeyword);
			}
			case 'let': {
				return TOKEN(TokenKind.LetKeyword);
			}
			case 'exists': {
				return TOKEN(TokenKind.ExistsKeyword);
			}
			default: {
				return TOKEN(TokenKind.Identifier, { value });
			}
		}
	}

	private tryReadDigits(): Token | undefined {
		// TODO: float number
		let value = '';
		while (this.char != null && digit.test(this.char)) {
			value += this.char;
			this.nextChar();
		}
		if (value.length === 0) {
			return;
		}
		return TOKEN(TokenKind.NumberLiteral, { value });
	}

	private readStringLiteral(): Token {
		let value = '';
		while (true) {
			if (this.char == null) {
				throw new AiScriptSyntaxError(`unexpected EOF`);
			}
			if (this.char === '"') {
				this.nextChar();
				break;
			}
			value += this.char;
			this.nextChar();
		}
		return TOKEN(TokenKind.StringLiteral, { value });
	}

	private readTemplate(): Token {
		const elements: Token[] = [];
		let buf = '';
		let tokenBuf: Token[] = [];
		let state: 'string' | 'expr' | 'finish' = 'string';

		while (state !== 'finish') {
			switch (state) {
				case 'string': {
					// テンプレートの終了が無いままEOFに達した
					if (this.char == null) {
						throw new AiScriptSyntaxError(`unexpected EOF`);
					}
					// テンプレートの終了
					if (this.char == '`') {
						this.nextChar();
						if (buf.length > 0) {
							elements.push(TOKEN(TokenKind.TemplateStringElement, { value: buf }));
						}
						state = 'finish';
						break;
					}
					// 埋め込み式の開始
					if (this.char == '{') {
						this.nextChar();
						if (buf.length > 0) {
							elements.push(TOKEN(TokenKind.TemplateStringElement, { value: buf }));
							buf = '';
						}
						state = 'expr';
						break;
					}
					buf += this.char;
					this.nextChar();
					break;
				}
				case 'expr': {
					// 埋め込み式の終端記号が無いままEOFに達した
					if (this.char == null) {
						throw new AiScriptSyntaxError(`unexpected EOF`);
					}
					// skip spasing
					if (spacingChars.includes(this.char)) {
						this.nextChar();
						continue;
					}
					// 埋め込み式の終了
					if ((this.char as string) === '}') {
						this.nextChar();
						elements.push(TOKEN(TokenKind.TemplateExprElement, { children: tokenBuf }));
						tokenBuf = [];
						state = 'string';
						break;
					}
					const token = this.nextToken();
					tokenBuf.push(token);
					break;
				}
			}
		}

		return TOKEN(TokenKind.Template, { children: elements });
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
export class TokenSequence implements ITokenStream {
	private seq: Token[];
	private _token?: Token;
	private index: number;

	constructor(sequence: TokenSequence['seq']) {
		this.seq = sequence;
		this.index = 0;
	}

	public init() {
		this.next();
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
		if (this.index >= this.seq.length) {
			this._token = TOKEN(TokenKind.EOF);
		} else {
			this._token = this.seq[this.index];
			this.index++;
		}
	}
}
