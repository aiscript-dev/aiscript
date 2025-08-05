import seedrandom from 'seedrandom';
import { RandomBase, readBigUintLittleEndian } from './randomBase.js';

const seedRandomBlockSize = Int32Array.BYTES_PER_ELEMENT;

export class SeedRandomWrapper extends RandomBase {
	private rng: seedrandom.PRNG;
	private buffer: Uint8Array;
	private filledBuffer: Uint8Array;
	constructor(seed: string | number) {
		super();
		this.rng = seedrandom(seed.toString());
		this.buffer = new Uint8Array(seedRandomBlockSize);
		this.filledBuffer = new Uint8Array(0);
	}
	private fillBuffer(): void {
		this.buffer.fill(0);
		this.buffer = this.fillBufferDirect(this.buffer);
		this.filledBuffer = this.buffer;
	}
	private fillBufferDirect(buffer: Uint8Array): Uint8Array {
		if ((buffer.length % seedRandomBlockSize) !== 0) throw new Error(`SeedRandomWrapper.fillBufferDirect should always be called with the buffer with the length a multiple-of-${seedRandomBlockSize}!`);
		const length = buffer.length / seedRandomBlockSize;
		const dataView = new DataView(buffer.buffer);
		let byteOffset = 0;
		for (let index = 0; index < length; index++, byteOffset += seedRandomBlockSize) {
			dataView.setInt32(byteOffset, this.rng.int32(), false);
		}
		return buffer;
	}
	protected generateBigUintByBytes(bytes: number): bigint {
		let u8a: Uint8Array<ArrayBufferLike> = new Uint8Array(Math.ceil(bytes / 8) * 8);
		if (u8a.length < 1 || !Number.isSafeInteger(bytes)) return 0n;
		u8a = this.generateBytes(u8a.subarray(0, bytes));
		return readBigUintLittleEndian(u8a.buffer) ?? 0n;
	}

	public generateBigUintByBits(bits: number): bigint {
		if (bits < 1 || !Number.isSafeInteger(bits)) return 0n;
		const bytes = Math.ceil(bits / 8);
		const wastedBits = BigInt(bytes * 8 - bits);
		return this.generateBigUintByBytes(bytes) >> wastedBits;
	}

	public generateBytes(array: Uint8Array): Uint8Array {
		if (array.length < 1) return array;
		array.fill(0);
		let dst = array;
		if (dst.length <= this.filledBuffer.length) {
			dst.set(this.filledBuffer.subarray(0, dst.length));
			this.filledBuffer = this.filledBuffer.subarray(dst.length);
			return array;
		} else {
			while (dst.length > 0) {
				if (this.filledBuffer.length === 0) {
					if (dst.length >= seedRandomBlockSize) {
						const df64 = dst.subarray(0, dst.length - (dst.length % seedRandomBlockSize));
						this.fillBufferDirect(df64);
						dst = dst.subarray(df64.length);
						continue;
					}
					this.fillBuffer();
				}
				if (dst.length <= this.filledBuffer.length) {
					dst.set(this.filledBuffer.subarray(0, dst.length));
					this.filledBuffer = this.filledBuffer.subarray(dst.length);
					return array;
				}
				dst.set(this.filledBuffer);
				dst = dst.subarray(this.filledBuffer.length);
				this.fillBuffer();
			}
			return array;
		}
	}
}
