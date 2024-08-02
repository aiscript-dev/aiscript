import { AiScriptSyntaxError } from '../error.js';
import { CharStream } from './streams/char-stream.js';
import { TOKEN, TokenKind } from './token.js';

import type { ITokenStream } from './streams/token-stream.js';
import type { Token, TokenPosition } from './token.js';

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
	public getToken(): Token {
		return this._tokens[0]!;
	}

	/**
	 * カーソル位置にあるトークンの種類が指定したトークンの種類と一致するかどうかを示す値を取得します。
	*/
	public is(kind: TokenKind): boolean {
		return this.getTokenKind() === kind;
	}

	/**
	 * カーソル位置にあるトークンの種類を取得します。
	*/
	public getTokenKind(): TokenKind {
		return this.getToken().kind;
	}

	/**
	 * カーソル位置にあるトークンに含まれる値を取得します。
	*/
	public getTokenValue(): string {
		return this.getToken().value!;
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
	 * カーソル位置にあるトークンの種類が指定したトークンの種類と一致することを確認します。
	 * 一致しなかった場合には文法エラーを発生させます。
	*/
	public expect(kind: TokenKind): void {
		if (!this.is(kind)) {
			throw new AiScriptSyntaxError(`unexpected token: ${TokenKind[this.getTokenKind()]}`, this.getPos());
		}
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
			const pos = this.stream.getPos();

			if (lineBreakChars.includes(this.stream.char)) {
				this.stream.next();
				token = TOKEN(TokenKind.NewLine, pos, { hasLeftSpacing });
				return token;
			}
			switch (this.stream.char) {
				case '!': {
					this.stream.next();
					if (!this.stream.eof && (this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.NotEq, pos, { hasLeftSpacing });
					} else {
						token = TOKEN(TokenKind.Not, pos, { hasLeftSpacing });
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
							token = TOKEN(TokenKind.Sharp3, pos, { hasLeftSpacing });
						}
					} else if (!this.stream.eof && (this.stream.char as string) === '[') {
						this.stream.next();
						token = TOKEN(TokenKind.OpenSharpBracket, pos, { hasLeftSpacing });
					} else {
						throw new AiScriptSyntaxError('invalid character: "#"', pos);
					}
					break;
				}
				case '%': {
					this.stream.next();
					token = TOKEN(TokenKind.Percent, pos, { hasLeftSpacing });
					break;
				}
				case '&': {
					this.stream.next();
					if (!this.stream.eof && (this.stream.char as string) === '&') {
						this.stream.next();
						token = TOKEN(TokenKind.And2, pos, { hasLeftSpacing });
					}
					break;
				}
				case '(': {
					this.stream.next();
					token = TOKEN(TokenKind.OpenParen, pos, { hasLeftSpacing });
					break;
				}
				case ')': {
					this.stream.next();
					token = TOKEN(TokenKind.CloseParen, pos, { hasLeftSpacing });
					break;
				}
				case '*': {
					this.stream.next();
					token = TOKEN(TokenKind.Asterisk, pos, { hasLeftSpacing });
					break;
				}
				case '+': {
					this.stream.next();
					if (!this.stream.eof && (this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.PlusEq, pos, { hasLeftSpacing });
					} else {
						token = TOKEN(TokenKind.Plus, pos, { hasLeftSpacing });
					}
					break;
				}
				case ',': {
					this.stream.next();
					token = TOKEN(TokenKind.Comma, pos, { hasLeftSpacing });
					break;
				}
				case '-': {
					this.stream.next();
					if (!this.stream.eof && (this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.MinusEq, pos, { hasLeftSpacing });
					} else {
						token = TOKEN(TokenKind.Minus, pos, { hasLeftSpacing });
					}
					break;
				}
				case '.': {
					this.stream.next();
					token = TOKEN(TokenKind.Dot, pos, { hasLeftSpacing });
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
						token = TOKEN(TokenKind.Slash, pos, { hasLeftSpacing });
					}
					break;
				}
				case ':': {
					this.stream.next();
					if (!this.stream.eof && (this.stream.char as string) === ':') {
						this.stream.next();
						token = TOKEN(TokenKind.Colon2, pos, { hasLeftSpacing });
					} else {
						token = TOKEN(TokenKind.Colon, pos, { hasLeftSpacing });
					}
					break;
				}
				case ';': {
					this.stream.next();
					token = TOKEN(TokenKind.SemiColon, pos, { hasLeftSpacing });
					break;
				}
				case '<': {
					this.stream.next();
					if (!this.stream.eof && (this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.LtEq, pos, { hasLeftSpacing });
					} else if (!this.stream.eof && (this.stream.char as string) === ':') {
						this.stream.next();
						token = TOKEN(TokenKind.Out, pos, { hasLeftSpacing });
					} else {
						token = TOKEN(TokenKind.Lt, pos, { hasLeftSpacing });
					}
					break;
				}
				case '=': {
					this.stream.next();
					if (!this.stream.eof && (this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.Eq2, pos, { hasLeftSpacing });
					} else if (!this.stream.eof && (this.stream.char as string) === '>') {
						this.stream.next();
						token = TOKEN(TokenKind.Arrow, pos, { hasLeftSpacing });
					} else {
						token = TOKEN(TokenKind.Eq, pos, { hasLeftSpacing });
					}
					break;
				}
				case '>': {
					this.stream.next();
					if (!this.stream.eof && (this.stream.char as string) === '=') {
						this.stream.next();
						token = TOKEN(TokenKind.GtEq, pos, { hasLeftSpacing });
					} else {
						token = TOKEN(TokenKind.Gt, pos, { hasLeftSpacing });
					}
					break;
				}
				case '?': {
					this.stream.next();
					token = TOKEN(TokenKind.Question, pos, { hasLeftSpacing });
					break;
				}
				case '@': {
					this.stream.next();
					token = TOKEN(TokenKind.At, pos, { hasLeftSpacing });
					break;
				}
				case '[': {
					this.stream.next();
					token = TOKEN(TokenKind.OpenBracket, pos, { hasLeftSpacing });
					break;
				}
				case '\\': {
					this.stream.next();
					token = TOKEN(TokenKind.BackSlash, pos, { hasLeftSpacing });
					break;
				}
				case ']': {
					this.stream.next();
					token = TOKEN(TokenKind.CloseBracket, pos, { hasLeftSpacing });
					break;
				}
				case '^': {
					this.stream.next();
					token = TOKEN(TokenKind.Hat, pos, { hasLeftSpacing });
					break;
				}
				case '`': {
					token = this.readTemplate(hasLeftSpacing);
					break;
				}
				case '{': {
					this.stream.next();
					token = TOKEN(TokenKind.OpenBrace, pos, { hasLeftSpacing });
					break;
				}
				case '|': {
					this.stream.next();
					if (!this.stream.eof && (this.stream.char as string) === '|') {
						this.stream.next();
						token = TOKEN(TokenKind.Or2, pos, { hasLeftSpacing });
					}
					break;
				}
				case '}': {
					this.stream.next();
					token = TOKEN(TokenKind.CloseBrace, pos, { hasLeftSpacing });
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
				throw new AiScriptSyntaxError(`invalid character: "${this.stream.char}"`, pos);
			}
			break;
		}
		return token;
	}

	private tryReadWord(hasLeftSpacing: boolean): Token | undefined {
		// read a word
		let value = '';

		const pos = this.stream.getPos();

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
				return TOKEN(TokenKind.NullKeyword, pos, { hasLeftSpacing });
			}
			case 'true': {
				return TOKEN(TokenKind.TrueKeyword, pos, { hasLeftSpacing });
			}
			case 'false': {
				return TOKEN(TokenKind.FalseKeyword, pos, { hasLeftSpacing });
			}
			case 'each': {
				return TOKEN(TokenKind.EachKeyword, pos, { hasLeftSpacing });
			}
			case 'for': {
				return TOKEN(TokenKind.ForKeyword, pos, { hasLeftSpacing });
			}
			case 'loop': {
				return TOKEN(TokenKind.LoopKeyword, pos, { hasLeftSpacing });
			}
			case 'do': {
				return TOKEN(TokenKind.DoKeyword, pos, { hasLeftSpacing });
			}
			case 'while': {
				return TOKEN(TokenKind.WhileKeyword, pos, { hasLeftSpacing });
			}
			case 'break': {
				return TOKEN(TokenKind.BreakKeyword, pos, { hasLeftSpacing });
			}
			case 'continue': {
				return TOKEN(TokenKind.ContinueKeyword, pos, { hasLeftSpacing });
			}
			case 'match': {
				return TOKEN(TokenKind.MatchKeyword, pos, { hasLeftSpacing });
			}
			case 'case': {
				return TOKEN(TokenKind.CaseKeyword, pos, { hasLeftSpacing });
			}
			case 'default': {
				return TOKEN(TokenKind.DefaultKeyword, pos, { hasLeftSpacing });
			}
			case 'if': {
				return TOKEN(TokenKind.IfKeyword, pos, { hasLeftSpacing });
			}
			case 'elif': {
				return TOKEN(TokenKind.ElifKeyword, pos, { hasLeftSpacing });
			}
			case 'else': {
				return TOKEN(TokenKind.ElseKeyword, pos, { hasLeftSpacing });
			}
			case 'return': {
				return TOKEN(TokenKind.ReturnKeyword, pos, { hasLeftSpacing });
			}
			case 'eval': {
				return TOKEN(TokenKind.EvalKeyword, pos, { hasLeftSpacing });
			}
			case 'var': {
				return TOKEN(TokenKind.VarKeyword, pos, { hasLeftSpacing });
			}
			case 'let': {
				return TOKEN(TokenKind.LetKeyword, pos, { hasLeftSpacing });
			}
			case 'exists': {
				return TOKEN(TokenKind.ExistsKeyword, pos, { hasLeftSpacing });
			}
			default: {
				return TOKEN(TokenKind.Identifier, pos, { hasLeftSpacing, value });
			}
		}
	}

	private tryReadDigits(hasLeftSpacing: boolean): Token | undefined {
		let wholeNumber = '';
		let fractional = '';

		const pos = this.stream.getPos();

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
				throw new AiScriptSyntaxError('digit expected', pos);
			}
		}
		let value;
		if (fractional.length > 0) {
			value = wholeNumber + '.' + fractional;
		} else {
			value = wholeNumber;
		}
		return TOKEN(TokenKind.NumberLiteral, pos, { hasLeftSpacing, value });
	}

	private readStringLiteral(hasLeftSpacing: boolean): Token {
		let value = '';
		const literalMark = this.stream.char;
		let state: 'string' | 'escape' | 'finish' = 'string';

		const pos = this.stream.getPos();
		this.stream.next();

		while (state !== 'finish') {
			switch (state) {
				case 'string': {
					if (this.stream.eof) {
						throw new AiScriptSyntaxError('unexpected EOF', pos);
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
						throw new AiScriptSyntaxError('unexpected EOF', pos);
					}
					value += this.stream.char;
					this.stream.next();
					state = 'string';
					break;
				}
			}
		}
		return TOKEN(TokenKind.StringLiteral, pos, { hasLeftSpacing, value });
	}

	private readTemplate(hasLeftSpacing: boolean): Token {
		const elements: Token[] = [];
		let buf = '';
		let tokenBuf: Token[] = [];
		let state: 'string' | 'escape' | 'expr' | 'finish' = 'string';

		const pos = this.stream.getPos();
		let elementPos = pos;
		this.stream.next();

		while (state !== 'finish') {
			switch (state) {
				case 'string': {
					// テンプレートの終了が無いままEOFに達した
					if (this.stream.eof) {
						throw new AiScriptSyntaxError('unexpected EOF', pos);
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
							elements.push(TOKEN(TokenKind.TemplateStringElement, elementPos, { hasLeftSpacing, value: buf }));
						}
						state = 'finish';
						break;
					}
					// 埋め込み式の開始
					if (this.stream.char === '{') {
						this.stream.next();
						if (buf.length > 0) {
							elements.push(TOKEN(TokenKind.TemplateStringElement, elementPos, { hasLeftSpacing, value: buf }));
							buf = '';
						}
						// ここから式エレメントになるので位置を更新
						elementPos = this.stream.getPos();
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
						throw new AiScriptSyntaxError('unexpected EOF', pos);
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
						throw new AiScriptSyntaxError('unexpected EOF', pos);
					}
					// skip spasing
					if (spaceChars.includes(this.stream.char)) {
						this.stream.next();
						continue;
					}
					// 埋め込み式の終了
					if ((this.stream.char as string) === '}') {
						elements.push(TOKEN(TokenKind.TemplateExprElement, elementPos, { hasLeftSpacing, children: tokenBuf }));
						// ここから文字列エレメントになるので位置を更新
						elementPos = this.stream.getPos();
						// TemplateExprElementトークンの終了位置をTokenStreamが取得するためのEOFトークンを追加
						tokenBuf.push(TOKEN(TokenKind.EOF, elementPos));
						tokenBuf = [];
						state = 'string';
						this.stream.next();
						break;
					}
					const token = this.readToken();
					tokenBuf.push(token);
					break;
				}
			}
		}

		return TOKEN(TokenKind.Template, pos, { hasLeftSpacing, children: elements });
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
