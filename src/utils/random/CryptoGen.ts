import { RandomBase, readBigUintLittleEndian } from './randomBase.js';

export class CryptoGen extends RandomBase {
	private static _instance: CryptoGen = new CryptoGen();
	public static get instance() : CryptoGen {
		return CryptoGen._instance;
	}

	private constructor() {
		super();
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
		return crypto.getRandomValues(array);
	}
}
