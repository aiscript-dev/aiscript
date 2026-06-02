import { RandomBase, readBigUintLittleEndian } from './randomBase.js';

// translated from https://github.com/skeeto/chacha-js/blob/master/chacha.js
const chacha20BlockSize = 64;
const CHACHA_ROUNDS = 20;
const CHACHA_KEYSIZE = 32;
const CHACHA_IVSIZE = 8;
function rotate(v: number, n: number): number { return (v << n) | (v >>> (32 - n)); }
function quarterRound(x: Uint32Array, a: number, b: number, c: number, d: number): void {
	if (x.length < 16) return;
	let va = x[a];
	let vb = x[b];
	let vc = x[c];
	let vd = x[d];
	if (va === undefined || vb === undefined || vc === undefined || vd === undefined) return;
	va = (va + vb) | 0;
	vd = rotate(vd ^ va, 16);
	vc = (vc + vd) | 0;
	vb = rotate(vb ^ vc, 12);
	va = (va + vb) | 0;
	vd = rotate(vd ^ va, 8);
	vc = (vc + vd) | 0;
	vb = rotate(vb ^ vc, 7);
	x[a] = va;
	x[b] = vb;
	x[c] = vc;
	x[d] = vd;
}
function generateChaCha20(dst: Uint32Array, state: Uint32Array) : void {
	if (dst.length < 16 || state.length < 16) return;
	dst.set(state);
	for (let i = 0; i < CHACHA_ROUNDS; i += 2) {
		quarterRound(dst, 0, 4, 8, 12);
		quarterRound(dst, 1, 5, 9, 13);
		quarterRound(dst, 2, 6, 10, 14);
		quarterRound(dst, 3, 7, 11, 15);
		quarterRound(dst, 0, 5, 10, 15);
		quarterRound(dst, 1, 6, 11, 12);
		quarterRound(dst, 2, 7, 8, 13);
		quarterRound(dst, 3, 4, 9, 14);
	}
	for (let i = 0; i < 16; i++) {
		let d = dst[i];
		const s = state[i];
		if (d === undefined || s === undefined) throw new Error('generateChaCha20: Something went wrong!');
		d = (d + s) | 0;
		dst[i] = d;
	}
}
export class ChaCha20 extends RandomBase {
	private keynonce: Uint32Array;
	private state: Uint32Array;
	private buffer: Uint8Array;
	private filledBuffer: Uint8Array;
	private counter: bigint;
	constructor(seed: Uint8Array) {
		const keyNonceBytes = CHACHA_IVSIZE + CHACHA_KEYSIZE;
		super();
		let keynonce = seed;
		if (keynonce.byteLength > keyNonceBytes) keynonce = seed.subarray(0, keyNonceBytes);
		if (keynonce.byteLength < keyNonceBytes) {
			const y = new Uint8Array(keyNonceBytes);
			y.set(keynonce);
			keynonce = y;
		}
		const key = keynonce.subarray(0, CHACHA_KEYSIZE);
		const nonce = keynonce.subarray(CHACHA_KEYSIZE, CHACHA_KEYSIZE + CHACHA_IVSIZE);
		const kn = new Uint8Array(16 * 4);
		kn.set([101, 120, 112, 97, 110, 100, 32, 51, 50, 45, 98, 121, 116, 101, 32, 107]);
		kn.set(key, 4 * 4);
		kn.set(nonce, 14 * 4);
		this.keynonce = new Uint32Array(kn.buffer);
		this.state = new Uint32Array(16);
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
		let counter = this.counter;
		const state = this.state;
		const counterState = new BigUint64Array(state.buffer);
		let dst = buffer;
		while (dst.length > 0) {
			const dbuf = dst.subarray(0, state.byteLength);
			const dst32 = new Uint32Array(dbuf.buffer);
			state.set(this.keynonce);
			counterState[6] = BigInt.asUintN(64, counter);
			generateChaCha20(dst32, state);
			dst = dst.subarray(dbuf.length);
			counter = BigInt.asUintN(64, counter + 1n);
		}
		this.counter = counter;
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
