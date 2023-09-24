import { AiScriptSyntaxError } from '../error.js';
import { TOKEN, TokenKind } from './token.js';
import type { Token } from './token.js';

const spacingChars = [' ', '\t', '\r', '\n'];
const digit = /^[0-9]$/;
const wordChar = /^[A-Za-z0-9_]$/;

/**
 * 入力文字列から文字を読み取るクラス
 * 通常はScannerクラスの内部で利用される。
*/
export class StringReader {
	private source: string;
	private index: number;
	private _char?: string;

	constructor(source: string) {
		this.source = source;
		this.index = 0;
	}

	public init(): void {
		this.load();
	}

	public get eof(): boolean {
		return (this.index >= this.source.length);
	}

	public get char(): string {
		if (this.eof) {
			throw new Error('End of stream');
		}
		if (this._char == null) {
			throw new Error('stream is not initialized yet');
		}
		return this._char;
	}

	public next(): void {
		if (!this.eof) {
			this.index++;
		}
		this.load();
	}

	private load(): void {
		if (!this.eof) {
			this._char = this.source[this.index];
		}
	}
}

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
 * 入力文字列からトークンを読み取るクラス
*/
export class Scanner implements ITokenStream {
	private stream: StringReader;
	private _token?: Token;

	constructor(source: string)
	constructor(stream: StringReader)
	constructor(x: string | StringReader) {
		if (typeof x === 'string') {
			this.stream = new StringReader(x);
			this.stream.init();
		} else {
			this.stream = x;
		}
	}

	public init(): void {
		this._token = this.nextToken();
	}

	public get eof(): boolean {
		return this.stream.eof;
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

	public expect(kind: TokenKind): void {
		if (this.kind !== kind) {
			throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[this.token.kind]}`);
		}
	}

	public nextWith(kind: TokenKind): void {
		this.expect(kind);
		this.next();
	}

	private nextToken(): Token {
		let token;
		while (true) {
			if (this.stream.eof) {
				token = TOKEN(TokenKind.EOF);
				break;
			}
			// skip spasing
			if (spacingChars.includes(this.stream.char)) {
				this.stream.next();
				continue;
			}
			switch (this.stream.char) {
				case '!': {
					this.stream.next();
					if ((this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.NotEq);
					} else {
						token = TOKEN(TokenKind.Not);
					}
					break;
				}
				case '"': {
					this.stream.next();
					token = this.readStringLiteral();
					break;
				}
				case '#': {
					this.stream.next();
					if ((this.stream.char as string) === '#') {
						this.stream.next();
						if ((this.stream.char as string) === '#') {
							this.stream.next();
							token = TOKEN(TokenKind.Sharp3);
						}
					} else if ((this.stream.char as string) === '[') {
						this.stream.next();
						token = TOKEN(TokenKind.OpenSharpBracket);
					} else {
						token = TOKEN(TokenKind.Sharp);
					}
					break;
				}
				case '%': {
					this.stream.next();
					token = TOKEN(TokenKind.Percent);
					break;
				}
				case '&': {
					this.stream.next();
					if ((this.stream.char as string) === '&') {
						this.stream.next();
						token = TOKEN(TokenKind.And2);
					}
					break;
				}
				case '(': {
					this.stream.next();
					token = TOKEN(TokenKind.OpenParen);
					break;
				}
				case ')': {
					this.stream.next();
					token = TOKEN(TokenKind.CloseParen);
					break;
				}
				case '*': {
					this.stream.next();
					token = TOKEN(TokenKind.Asterisk);
					break;
				}
				case '+': {
					this.stream.next();
					if ((this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.PlusEq);
					} else {
						token = TOKEN(TokenKind.Plus);
					}
					break;
				}
				case ',': {
					this.stream.next();
					token = TOKEN(TokenKind.Comma);
					break;
				}
				case '-': {
					this.stream.next();
					if ((this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.MinusEq);
					} else {
						token = TOKEN(TokenKind.Minus);
					}
					break;
				}
				case '.': {
					this.stream.next();
					token = TOKEN(TokenKind.Dot);
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
						token = TOKEN(TokenKind.Slash);
					}
					break;
				}
				case ':': {
					this.stream.next();
					if ((this.stream.char as string) === ':') {
						this.stream.next();
						token = TOKEN(TokenKind.Colon2);
					} else {
						token = TOKEN(TokenKind.Colon);
					}
					break;
				}
				case ';': {
					this.stream.next();
					token = TOKEN(TokenKind.SemiColon);
					break;
				}
				case '<': {
					this.stream.next();
					if ((this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.LtEq);
					} else if ((this.stream.char as string) === ':') {
						this.stream.next();
						token = TOKEN(TokenKind.Out);
					} else {
						token = TOKEN(TokenKind.Lt);
					}
					break;
				}
				case '=': {
					this.stream.next();
					if ((this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.Eq2);
					} else if ((this.stream.char as string) === '>') {
						this.stream.next();
						token = TOKEN(TokenKind.Arrow);
					} else {
						token = TOKEN(TokenKind.Eq);
					}
					break;
				}
				case '>': {
					this.stream.next();
					if ((this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.GtEq);
					} else {
						token = TOKEN(TokenKind.Gt);
					}
					break;
				}
				case '@': {
					this.stream.next();
					token = TOKEN(TokenKind.At);
					break;
				}
				case '[': {
					this.stream.next();
					token = TOKEN(TokenKind.OpenBracket);
					break;
				}
				case ']': {
					this.stream.next();
					token = TOKEN(TokenKind.CloseBracket);
					break;
				}
				case '^': {
					this.stream.next();
					token = TOKEN(TokenKind.Hat);
					break;
				}
				case '`': {
					this.stream.next();
					token = this.readTemplate();
					break;
				}
				case '{': {
					this.stream.next();
					token = TOKEN(TokenKind.OpenBrace);
					break;
				}
				case '|': {
					this.stream.next();
					if ((this.stream.char as string) === '|') {
						this.stream.next();
						token = TOKEN(TokenKind.Or2);
					}
					break;
				}
				case '}': {
					this.stream.next();
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
				throw new AiScriptSyntaxError(`invalid character: "${this.stream.char}"`);
			}
			break;
		}
		return token;
	}

	private tryReadWord(): Token | undefined {
		// read a word
		let value = '';
		while (this.stream.char != null && wordChar.test(this.stream.char)) {
			value += this.stream.char;
			this.stream.next();
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
		while (this.stream.char != null && digit.test(this.stream.char)) {
			value += this.stream.char;
			this.stream.next();
		}
		if (value.length === 0) {
			return;
		}
		return TOKEN(TokenKind.NumberLiteral, { value });
	}

	private readStringLiteral(): Token {
		let value = '';
		while (true) {
			if (this.stream.char == null) {
				throw new AiScriptSyntaxError(`unexpected EOF`);
			}
			if (this.stream.char === '"') {
				this.stream.next();
				break;
			}
			value += this.stream.char;
			this.stream.next();
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
					if (this.stream.eof) {
						throw new AiScriptSyntaxError(`unexpected EOF`);
					}
					// テンプレートの終了
					if (this.stream.char == '`') {
						this.stream.next();
						if (buf.length > 0) {
							elements.push(TOKEN(TokenKind.TemplateStringElement, { value: buf }));
						}
						state = 'finish';
						break;
					}
					// 埋め込み式の開始
					if (this.stream.char == '{') {
						this.stream.next();
						if (buf.length > 0) {
							elements.push(TOKEN(TokenKind.TemplateStringElement, { value: buf }));
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
						throw new AiScriptSyntaxError(`unexpected EOF`);
					}
					// skip spasing
					if (spacingChars.includes(this.stream.char)) {
						this.stream.next();
						continue;
					}
					// 埋め込み式の終了
					if ((this.stream.char as string) === '}') {
						this.stream.next();
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

	private skipCommentRange() {
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

/**
 * 既に生成済みのトークン列からトークンを読み取るクラス
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
