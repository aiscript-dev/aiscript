/**
 * 入力文字列から文字を読み取るクラス
*/
export class CharStream {
	private pages: Map<number, string>;
	private firstPageIndex: number;
	private lastPageIndex: number;
	private pageIndex: number;
	private address: number;
	private _char?: string;
	/** zero-based number */
	private line: number;
	/** zero-based number */
	private column: number;

	constructor(source: string, opts?: { line?: number, column?: number }) {
		this.pages = new Map();
		this.pages.set(0, source);
		this.firstPageIndex = 0;
		this.lastPageIndex = 0;
		this.pageIndex = 0;
		this.address = 0;
		this.line = opts?.line ?? 0;
		this.column = opts?.column ?? 0;
		this.moveNext();
	}

	/**
	 * ストリームの終わりに達しているかどうかを取得します。
	*/
	public get eof(): boolean {
		return this.endOfPage && this.isLastPage;
	}

	/**
	 * カーソル位置にある文字を取得します。
	*/
	public get char(): string {
		if (this.eof) {
			throw new Error('end of stream');
		}
		return this._char!;
	}

	/**
	 * カーソル位置に対応するソースコード上の行番号と列番号を取得します。
	*/
	public getPos(): { line: number, column: number } {
		return {
			line: (this.line + 1),
			column: (this.column + 1),
		};
	}

	/**
	 * カーソル位置を次の文字へ進めます。
	*/
	public next(): void {
		if (!this.eof && this._char === '\n') {
			this.line++;
			this.column = 0;
		} else {
			this.column++;
		}
		this.incAddr();
		this.moveNext();
	}

	/**
	 * カーソル位置を前の文字へ戻します。
	*/
	public prev(): void {
		this.decAddr();
		this.movePrev();
	}

	private get isFirstPage(): boolean {
		return (this.pageIndex <= this.firstPageIndex);
	}

	private get isLastPage(): boolean {
		return (this.pageIndex >= this.lastPageIndex);
	}

	private get endOfPage(): boolean {
		const page = this.pages.get(this.pageIndex)!;
		return (this.address >= page.length);
	}

	private moveNext(): void {
		this.loadChar();
		while (true) {
			if (!this.eof && this._char === '\r') {
				this.incAddr();
				this.loadChar();
				continue;
			}
			break;
		}
	}

	private incAddr(): void {
		if (!this.endOfPage) {
			this.address++;
		} else if (!this.isLastPage) {
			this.pageIndex++;
			this.address = 0;
		}
	}

	private movePrev(): void {
		this.loadChar();
		while (true) {
			if (!this.eof && this._char === '\r') {
				this.decAddr();
				this.loadChar();
				continue;
			}
			break;
		}
	}

	private decAddr(): void {
		if (this.address > 0) {
			this.address--;
		} else if (!this.isFirstPage) {
			this.pageIndex--;
			this.address = this.pages.get(this.pageIndex)!.length - 1;
		}
	}

	private loadChar(): void {
		if (this.eof) {
			this._char = undefined;
		} else {
			this._char = this.pages.get(this.pageIndex)![this.address]!;
		}
	}
}
