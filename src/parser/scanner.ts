import { AiScriptSyntaxError } from '../error.js';
import { CharStream } from './streams/char-stream.js';
import { TOKEN, TokenKind } from './token.js';

import type { ITokenStream } from './streams/token-stream.js';
import type { Token, TokenLocation } from './token.js';

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

	constructor(source: string)
	constructor(stream: CharStream)
	constructor(x: string | CharStream) {
		if (typeof x === 'string') {
			this.stream = new CharStream(x);
		} else {
			this.stream = x;
		}
		this._tokens.push(this.readToken());
	}

	/**
	 * カーソル位置にあるトークンを取得します。
	*/
	public get token(): Token {
		return this._tokens[0]!;
	}

	/**
	 * カーソル位置にあるトークンの種類を取得します。
	*/
	public getKind(): TokenKind {
		return this.token.kind;
	}

	/**
	 * カーソル位置にあるトークンの位置情報を取得します。
	*/
	public getPos(): TokenLocation {
		return this.token.pos;
	}

	/**
	 * カーソル位置を次のトークンへ進めます。
	*/
	public next(): void {
		// 現在のトークンがEOFだったら次のトークンに進まない
		if (this._tokens[0]!.kind === TokenKind.EOF) {
			return;
		}

		this._tokens.shift();

		if (this._tokens.length === 0) {
			this._tokens.push(this.readToken());
		}
	}

	/**
	 * トークンの先読みを行います。カーソル位置は移動されません。
	*/
	public lookahead(offset: number): Token {
		while (this._tokens.length <= offset) {
			this._tokens.push(this.readToken());
		}

		return this._tokens[offset]!;
	}

	/**
	 * カーソル位置にあるトークンが指定したトークンの種類と一致するかを確認します。
	 * 一致しなかった場合には文法エラーを発生させます。
	*/
	public expect(kind: TokenKind): void {
		if (this.getKind() !== kind) {
			throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[this.getKind()]}`, this.getPos());
		}
	}

	/**
	 * カーソル位置にあるトークンが指定したトークンの種類と一致することを確認し、
	 * カーソル位置を次のトークンへ進めます。
	*/
	public nextWith(kind: TokenKind): void {
		this.expect(kind);
		this.next();
	}

	private readToken(): Token {
		let token;
		let hasLeftSpacing = false;

		while (true) {
			if (this.stream.eof) {
				token = TOKEN(TokenKind.EOF, this.stream.getPos(), { hasLeftSpacing });
				break;
			}
			// skip spasing
			if (spaceChars.includes(this.stream.char)) {
				this.stream.next();
				hasLeftSpacing = true;
				continue;
			}

			// トークン位置を記憶
			const loc = this.stream.getPos();

			if (lineBreakChars.includes(this.stream.char)) {
				this.stream.next();
				token = TOKEN(TokenKind.NewLine, loc, { hasLeftSpacing });
				return token;
			}
			switch (this.stream.char) {
				case '!': {
					this.stream.next();
					if (!this.stream.eof && (this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.NotEq, loc, { hasLeftSpacing });
					} else {
						token = TOKEN(TokenKind.Not, loc, { hasLeftSpacing });
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
					if (!this.stream.eof && (this.stream.char as string) === '#') {
						this.stream.next();
						if (!this.stream.eof && (this.stream.char as string) === '#') {
							this.stream.next();
							token = TOKEN(TokenKind.Sharp3, loc, { hasLeftSpacing });
						}
					} else if (!this.stream.eof && (this.stream.char as string) === '[') {
						this.stream.next();
						token = TOKEN(TokenKind.OpenSharpBracket, loc, { hasLeftSpacing });
					} else {
						throw new AiScriptSyntaxError('invalid character: "#"', loc);
					}
					break;
				}
				case '%': {
					this.stream.next();
					token = TOKEN(TokenKind.Percent, loc, { hasLeftSpacing });
					break;
				}
				case '&': {
					this.stream.next();
					if (!this.stream.eof && (this.stream.char as string) === '&') {
						this.stream.next();
						token = TOKEN(TokenKind.And2, loc, { hasLeftSpacing });
					}
					break;
				}
				case '(': {
					this.stream.next();
					token = TOKEN(TokenKind.OpenParen, loc, { hasLeftSpacing });
					break;
				}
				case ')': {
					this.stream.next();
					token = TOKEN(TokenKind.CloseParen, loc, { hasLeftSpacing });
					break;
				}
				case '*': {
					this.stream.next();
					token = TOKEN(TokenKind.Asterisk, loc, { hasLeftSpacing });
					break;
				}
				case '+': {
					this.stream.next();
					if (!this.stream.eof && (this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.PlusEq, loc, { hasLeftSpacing });
					} else {
						token = TOKEN(TokenKind.Plus, loc, { hasLeftSpacing });
					}
					break;
				}
				case ',': {
					this.stream.next();
					token = TOKEN(TokenKind.Comma, loc, { hasLeftSpacing });
					break;
				}
				case '-': {
					this.stream.next();
					if (!this.stream.eof && (this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.MinusEq, loc, { hasLeftSpacing });
					} else {
						token = TOKEN(TokenKind.Minus, loc, { hasLeftSpacing });
					}
					break;
				}
				case '.': {
					this.stream.next();
					token = TOKEN(TokenKind.Dot, loc, { hasLeftSpacing });
					break;
				}
				case '/': {
					this.stream.next();
					if (!this.stream.eof && (this.stream.char as string) === '*') {
						this.stream.next();
						this.skipCommentRange();
						continue;
					} else if (!this.stream.eof && (this.stream.char as string) === '/') {
						this.stream.next();
						this.skipCommentLine();
						continue;
					} else {
						token = TOKEN(TokenKind.Slash, loc, { hasLeftSpacing });
					}
					break;
				}
				case ':': {
					this.stream.next();
					if (!this.stream.eof && (this.stream.char as string) === ':') {
						this.stream.next();
						token = TOKEN(TokenKind.Colon2, loc, { hasLeftSpacing });
					} else {
						token = TOKEN(TokenKind.Colon, loc, { hasLeftSpacing });
					}
					break;
				}
				case ';': {
					this.stream.next();
					token = TOKEN(TokenKind.SemiColon, loc, { hasLeftSpacing });
					break;
				}
				case '<': {
					this.stream.next();
					if (!this.stream.eof && (this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.LtEq, loc, { hasLeftSpacing });
					} else if (!this.stream.eof && (this.stream.char as string) === ':') {
						this.stream.next();
						token = TOKEN(TokenKind.Out, loc, { hasLeftSpacing });
					} else {
						token = TOKEN(TokenKind.Lt, loc, { hasLeftSpacing });
					}
					break;
				}
				case '=': {
					this.stream.next();
					if (!this.stream.eof && (this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.Eq2, loc, { hasLeftSpacing });
					} else if (!this.stream.eof && (this.stream.char as string) === '>') {
						this.stream.next();
						token = TOKEN(TokenKind.Arrow, loc, { hasLeftSpacing });
					} else {
						token = TOKEN(TokenKind.Eq, loc, { hasLeftSpacing });
					}
					break;
				}
				case '>': {
					this.stream.next();
					if (!this.stream.eof && (this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.GtEq, loc, { hasLeftSpacing });
					} else {
						token = TOKEN(TokenKind.Gt, loc, { hasLeftSpacing });
					}
					break;
				}
				case '?': {
					this.stream.next();
					token = TOKEN(TokenKind.Question, loc, { hasLeftSpacing });
					break;
				}
				case '@': {
					this.stream.next();
					token = TOKEN(TokenKind.At, loc, { hasLeftSpacing });
					break;
				}
				case '[': {
					this.stream.next();
					token = TOKEN(TokenKind.OpenBracket, loc, { hasLeftSpacing });
					break;
				}
				case '\\': {
					this.stream.next();
					token = TOKEN(TokenKind.BackSlash, loc, { hasLeftSpacing });
					break;
				}
				case ']': {
					this.stream.next();
					token = TOKEN(TokenKind.CloseBracket, loc, { hasLeftSpacing });
					break;
				}
				case '^': {
					this.stream.next();
					token = TOKEN(TokenKind.Hat, loc, { hasLeftSpacing });
					break;
				}
				case '`': {
					token = this.readTemplate(hasLeftSpacing);
					break;
				}
				case '{': {
					this.stream.next();
					token = TOKEN(TokenKind.OpenBrace, loc, { hasLeftSpacing });
					break;
				}
				case '|': {
					this.stream.next();
					if (!this.stream.eof && (this.stream.char as string) === '|') {
						this.stream.next();
						token = TOKEN(TokenKind.Or2, loc, { hasLeftSpacing });
					}
					break;
				}
				case '}': {
					this.stream.next();
					token = TOKEN(TokenKind.CloseBrace, loc, { hasLeftSpacing });
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
				throw new AiScriptSyntaxError(`invalid character: "${this.stream.char}"`, loc);
			}
			break;
		}
		return token;
	}

	private tryReadWord(hasLeftSpacing: boolean): Token | undefined {
		// read a word
		let value = '';

		const loc = this.stream.getPos();

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
				return TOKEN(TokenKind.NullKeyword, loc, { hasLeftSpacing });
			}
			case 'true': {
				return TOKEN(TokenKind.TrueKeyword, loc, { hasLeftSpacing });
			}
			case 'false': {
				return TOKEN(TokenKind.FalseKeyword, loc, { hasLeftSpacing });
			}
			case 'each': {
				return TOKEN(TokenKind.EachKeyword, loc, { hasLeftSpacing });
			}
			case 'for': {
				return TOKEN(TokenKind.ForKeyword, loc, { hasLeftSpacing });
			}
			case 'loop': {
				return TOKEN(TokenKind.LoopKeyword, loc, { hasLeftSpacing });
			}
			case 'do': {
				return TOKEN(TokenKind.DoKeyword, loc, { hasLeftSpacing });
			}
			case 'while': {
				return TOKEN(TokenKind.WhileKeyword, loc, { hasLeftSpacing });
			}
			case 'break': {
				return TOKEN(TokenKind.BreakKeyword, loc, { hasLeftSpacing });
			}
			case 'continue': {
				return TOKEN(TokenKind.ContinueKeyword, loc, { hasLeftSpacing });
			}
			case 'match': {
				return TOKEN(TokenKind.MatchKeyword, loc, { hasLeftSpacing });
			}
			case 'case': {
				return TOKEN(TokenKind.CaseKeyword, loc, { hasLeftSpacing });
			}
			case 'default': {
				return TOKEN(TokenKind.DefaultKeyword, loc, { hasLeftSpacing });
			}
			case 'if': {
				return TOKEN(TokenKind.IfKeyword, loc, { hasLeftSpacing });
			}
			case 'elif': {
				return TOKEN(TokenKind.ElifKeyword, loc, { hasLeftSpacing });
			}
			case 'else': {
				return TOKEN(TokenKind.ElseKeyword, loc, { hasLeftSpacing });
			}
			case 'return': {
				return TOKEN(TokenKind.ReturnKeyword, loc, { hasLeftSpacing });
			}
			case 'eval': {
				return TOKEN(TokenKind.EvalKeyword, loc, { hasLeftSpacing });
			}
			case 'var': {
				return TOKEN(TokenKind.VarKeyword, loc, { hasLeftSpacing });
			}
			case 'let': {
				return TOKEN(TokenKind.LetKeyword, loc, { hasLeftSpacing });
			}
			case 'exists': {
				return TOKEN(TokenKind.ExistsKeyword, loc, { hasLeftSpacing });
			}
			default: {
				return TOKEN(TokenKind.Identifier, loc, { hasLeftSpacing, value });
			}
		}
	}

	private tryReadDigits(hasLeftSpacing: boolean): Token | undefined {
		let wholeNumber = '';
		let fractional = '';

		const loc = this.stream.getPos();

		while (!this.stream.eof && digit.test(this.stream.char)) {
			wholeNumber += this.stream.char;
			this.stream.next();
		}
		if (wholeNumber.length === 0) {
			return;
		}
		if (!this.stream.eof && this.stream.char === '.') {
			this.stream.next();
			while (!this.stream.eof as boolean && digit.test(this.stream.char as string)) {
				fractional += this.stream.char;
				this.stream.next();
			}
			if (fractional.length === 0) {
				throw new AiScriptSyntaxError('digit expected', loc);
			}
		}
		let value;
		if (fractional.length > 0) {
			value = wholeNumber + '.' + fractional;
		} else {
			value = wholeNumber;
		}
		return TOKEN(TokenKind.NumberLiteral, loc, { hasLeftSpacing, value });
	}

	private readStringLiteral(hasLeftSpacing: boolean): Token {
		let value = '';
		const literalMark = this.stream.char;
		let state: 'string' | 'escape' | 'finish' = 'string';

		const loc = this.stream.getPos();
		this.stream.next();

		while (state !== 'finish') {
			switch (state) {
				case 'string': {
					if (this.stream.eof) {
						throw new AiScriptSyntaxError('unexpected EOF', loc);
					}
					if (this.stream.char === '\\') {
						this.stream.next();
						state = 'escape';
						break;
					}
					if (this.stream.char === literalMark) {
						this.stream.next();
						state = 'finish';
						break;
					}
					value += this.stream.char;
					this.stream.next();
					break;
				}
				case 'escape': {
					if (this.stream.eof) {
						throw new AiScriptSyntaxError('unexpected EOF', loc);
					}
					value += this.stream.char;
					this.stream.next();
					state = 'string';
					break;
				}
			}
		}
		return TOKEN(TokenKind.StringLiteral, loc, { hasLeftSpacing, value });
	}

	private readTemplate(hasLeftSpacing: boolean): Token {
		const elements: Token[] = [];
		let buf = '';
		let tokenBuf: Token[] = [];
		let state: 'string' | 'escape' | 'expr' | 'finish' = 'string';

		const loc = this.stream.getPos();
		let elementLoc = loc;
		this.stream.next();

		while (state !== 'finish') {
			switch (state) {
				case 'string': {
					// テンプレートの終了が無いままEOFに達した
					if (this.stream.eof) {
						throw new AiScriptSyntaxError('unexpected EOF', loc);
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
							elements.push(TOKEN(TokenKind.TemplateStringElement, elementLoc, { hasLeftSpacing, value: buf }));
						}
						state = 'finish';
						break;
					}
					// 埋め込み式の開始
					if (this.stream.char === '{') {
						this.stream.next();
						if (buf.length > 0) {
							elements.push(TOKEN(TokenKind.TemplateStringElement, elementLoc, { hasLeftSpacing, value: buf }));
							buf = '';
						}
						// ここから式エレメントになるので位置を更新
						elementLoc = this.stream.getPos();
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
						throw new AiScriptSyntaxError('unexpected EOF', loc);
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
						throw new AiScriptSyntaxError('unexpected EOF', loc);
					}
					// skip spasing
					if (spaceChars.includes(this.stream.char)) {
						this.stream.next();
						continue;
					}
					// 埋め込み式の終了
					if ((this.stream.char as string) === '}') {
						this.stream.next();
						elements.push(TOKEN(TokenKind.TemplateExprElement, elementLoc, { hasLeftSpacing, children: tokenBuf }));
						tokenBuf = [];
						// ここから文字列エレメントになるので位置を更新
						elementLoc = this.stream.getPos();
						state = 'string';
						break;
					}
					const token = this.readToken();
					tokenBuf.push(token);
					break;
				}
			}
		}

		return TOKEN(TokenKind.Template, loc, { hasLeftSpacing, children: elements });
	}

	private skipCommentLine(): void {
		while (true) {
			if (this.stream.eof) {
				break;
			}
			if (this.stream.char === '\n') {
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
