import sodium from 'libsodium-wrappers-sumo';
import { RandomBase, bigMaxSafeIntegerExclusive, bigSafeIntegerBits, readBigUintLittleEndian, safeIntegerBits } from './randomBase.js';

const chacha20BlockSize = 64;
const bigChacha20BlockSize = BigInt(chacha20BlockSize);

export class ChaCha20 extends RandomBase {
	public static ready = sodium.ready;
	private key: Uint8Array;
	private nonce: Uint8Array;
	private buffer: Uint8Array;
	private filledBuffer: Uint8Array;
	private counter: bigint;
	constructor(seed?: string | number | Uint8Array | undefined) {
		const keyNonceBytes = sodium.crypto_stream_chacha20_NONCEBYTES + sodium.crypto_stream_chacha20_KEYBYTES;
		super();
		let keynonce: Uint8Array;
		if (typeof seed === 'undefined') {
			keynonce = crypto.getRandomValues(new Uint8Array(keyNonceBytes));
		} else if (typeof seed === 'number') {
			const array = new Float64Array([seed]);
			keynonce = sodium.crypto_generichash(keyNonceBytes, new Uint8Array(array.buffer));
		} else {
			keynonce = sodium.crypto_generichash(keyNonceBytes, seed);
		}
		this.key = keynonce.subarray(0, sodium.crypto_stream_chacha20_KEYBYTES);
		this.nonce = keynonce.subarray(sodium.crypto_stream_chacha20_KEYBYTES);
		this.buffer = new Uint8Array(chacha20BlockSize);
		this.counter = 0n;
		this.filledBuffer = new Uint8Array(0);
	}
	private fillBuffer(): void {
		this.buffer.fill(0);
		this.buffer = this.fillBufferDirect(this.buffer);
		this.filledBuffer = this.buffer;
	}
	private fillBufferDirect(buffer: Uint8Array): Uint8Array {
		if ((buffer.length % chacha20BlockSize) !== 0) throw new Error('ChaCha20.fillBufferDirect should always be called with the buffer with the length a multiple-of-64!');
		buffer.fill(0);
		let blocks = BigInt(buffer.length / chacha20BlockSize);
		let counter = this.counter % bigMaxSafeIntegerExclusive;
		const newCount = counter + blocks;
		const overflow = newCount >> bigSafeIntegerBits;
		if (overflow === 0n) {
			buffer.set(sodium.crypto_stream_chacha20_xor_ic(buffer, this.nonce, Number(counter), this.key));
			this.counter = newCount;
			return buffer;
		}
		let dst = buffer;
		while (dst.length > 0) {
			const remainingBlocks = bigMaxSafeIntegerExclusive - counter;
			const genBlocks = remainingBlocks > blocks ? blocks : remainingBlocks;
			blocks -= genBlocks;
			const dbuf = dst.subarray(0, Number(genBlocks * bigChacha20BlockSize));	// safe integers wouldn't lose any precision with multiplying by a power-of-two anyway.
			dbuf.set(sodium.crypto_stream_chacha20_xor_ic(dbuf, this.nonce, Number(counter), this.key));
			dst = dst.subarray(dbuf.length);
			counter = BigInt.asUintN(safeIntegerBits, counter + genBlocks);
			this.counter = counter;
		}
		return buffer;
	}
	protected generateBigUintByBytes(bytes: number): bigint {
		let u8a = new Uint8Array(Math.ceil(bytes / 8) * 8);
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
					if (dst.length >= chacha20BlockSize) {
						const df64 = dst.subarray(0, dst.length - (dst.length % chacha20BlockSize));
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
