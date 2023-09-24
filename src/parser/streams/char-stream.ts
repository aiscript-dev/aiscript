/**
 * 入力文字列から文字を読み取るクラス
*/
export class CharStream {
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
			throw new Error('end of stream');
		}
		if (this._char == null) {
			// EOFではない時にnullだったらinitされていない
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
