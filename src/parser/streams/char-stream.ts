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

	constructor(source: string) {
		this.pages = new Map();
		this.pages.set(0, source);
		this.firstPageIndex = 0;
		this.lastPageIndex = 0;
		this.pageIndex = 0;
		this.address = 0;
	}

	public init(): void {
		this.loadChar();
	}

	public get eof(): boolean {
		return this.endOfPage && this.isLastPage;
	}

	public get char(): string {
		if (this.eof) {
			throw new Error('end of stream');
		}
		if (this._char == null) {
			// EOFではない時にnullだったらinitされていない
			throw new Error('stream is not initialized yet');
		}
		return this._char;
	}

	public next(): void {
		if (!this.endOfPage) {
			this.address++;
		} else if (!this.isLastPage) {
			this.pageIndex++;
			this.address = 0;
		}
		this.loadChar();
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

	private get isFirstPage() {
		return (this.pageIndex <= this.firstPageIndex);
	}

	private get isLastPage() {
		return (this.pageIndex >= this.lastPageIndex);
	}

	private get endOfPage(): boolean {
		const page = this.pages.get(this.pageIndex)!;
		return (this.address >= page.length);
	}

	private loadChar(): void {
		if (!this.eof) {
			this._char = this.pages.get(this.pageIndex)![this.address];
		}
	}
}
