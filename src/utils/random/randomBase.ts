export const safeIntegerBits = Math.ceil(Math.log2(Number.MAX_SAFE_INTEGER));
export const bigSafeIntegerBits = BigInt(safeIntegerBits);
export const bigMaxSafeIntegerExclusive = 1n << bigSafeIntegerBits;
export const fractionBits = safeIntegerBits - 1;
export const bigFractionBits = BigInt(fractionBits);

export abstract class RandomBase {
	protected abstract generateBigUintByBytes(bytes: number): bigint;
	public abstract generateBigUintByBits(bits: number): bigint;
	public abstract generateBytes(array: Uint8Array): Uint8Array;

	public generateNumber0To1(): number {
		let res = this.generateBigUintByBits(safeIntegerBits);
		let exponent = 1022;
		let remainingFractionBits = safeIntegerBits - bitsToRepresent(res);
		while (remainingFractionBits > 0 && exponent >= safeIntegerBits) {
			exponent -= remainingFractionBits;
			res <<= BigInt(remainingFractionBits);
			res |= this.generateBigUintByBits(remainingFractionBits);
			remainingFractionBits = safeIntegerBits - bitsToRepresent(res);
		}
		if (remainingFractionBits > 0) {
			const shift = Math.min(exponent - 1, remainingFractionBits);
			res <<= BigInt(shift);
			res |= this.generateBigUintByBits(shift);
			exponent = Math.max(exponent - shift, 0);
		}
		return (Number(res) * 0.5 ** safeIntegerBits) * (0.5 ** (1022 - exponent));
	}

	public generateUniform(maxInclusive: bigint): bigint {
		if (maxInclusive < 1) return 0n;
		const log2 = maxInclusive.toString(2).length;
		const bytes = Math.ceil(log2 / 8);
		const wastedBits = BigInt(bytes * 8 - log2);
		let result: bigint;
		do {
			result = this.generateBigUintByBytes(bytes) >> wastedBits;
		} while (result > maxInclusive);
		return result;
	}

	public generateRandomIntegerInRange(min: number, max: number): number | null {
		const ceilMin = Math.ceil(min);
		const floorMax = Math.floor(max);
		const signedScale = floorMax - ceilMin;
		if (signedScale === 0) return ceilMin;
		const scale = Math.abs(signedScale);
		const scaleSign = Math.sign(signedScale);
		if (!Number.isSafeInteger(scale) || !Number.isSafeInteger(ceilMin) || !Number.isSafeInteger(floorMax)) {
			return null;
		}
		const bigScale = BigInt(scale);
		return Number(this.generateUniform(bigScale)) * scaleSign + ceilMin;
	}
}

export function bitsToRepresent(num: bigint): number {
	if (num === 0n) return 0;
	return num.toString(2).length;
}

function readSmallBigUintLittleEndian(buffer: ArrayBufferLike): bigint | null {
	if (buffer.byteLength === 0) return null;
	if (buffer.byteLength < 8) {
		const array = new Uint8Array(8);
		array.set(new Uint8Array(buffer));
		return new DataView(array.buffer).getBigUint64(0, true);
	}
	return new DataView(buffer).getBigUint64(0, true);
}

export function readBigUintLittleEndian(buffer: ArrayBufferLike): bigint | null {
	if (buffer.byteLength === 0) return null;
	if (buffer.byteLength <= 8) {
		return readSmallBigUintLittleEndian(buffer);
	}
	const dataView = new DataView(buffer);
	let pos = 0n;
	let res = 0n;
	let index = 0;
	for (; index < dataView.byteLength - 7; index += 8, pos += 64n) {
		const element = dataView.getBigUint64(index, true);
		res |= element << pos;
	}
	if (index < dataView.byteLength) {
		const array = new Uint8Array(8);
		array.set(new Uint8Array(buffer, index));
		res |= new DataView(array.buffer).getBigUint64(0, true) << pos;
	}
	return res;
}
