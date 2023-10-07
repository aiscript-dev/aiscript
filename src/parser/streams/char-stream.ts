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
		this.loadChar();
	}

	public get eof(): boolean {
		return this.endOfPage && this.isLastPage;
	}

	public get char(): string {
		if (this.eof) {
			throw new Error('end of stream');
		}
		return this._char!;
	}

	public getPos(): { line: number, column: number } {
		return {
			line: (this.line + 1),
			column: (this.column + 1),
		};
	}

	public next(): void {
		if (!this.endOfPage) {
			this.address++;
		} else if (!this.isLastPage) {
			this.pageIndex++;
			this.address = 0;
		}
		this.loadChar();

		// column, line
		if (!this.eof) {
			if (this._char === '\n') {
				this.line++;
				this.column = 0;
			} else if (this._char !== '\r') {
				this.column++;
			}
		} else {
			this.column++;
		}
	}

	public prev(): void {
		if (this.address > 0) {
			this.address--;
		} else if (!this.isFirstPage) {
			this.pageIndex--;
			this.address = this.pages.get(this.pageIndex)!.length - 1;
		}
		this.loadChar();
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

	private loadChar(): void {
		if (this.eof) {
			this._char = undefined;
		} else {
			this._char = this.pages.get(this.pageIndex)![this.address]!;
		}
	}
}
