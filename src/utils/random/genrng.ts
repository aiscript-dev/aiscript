import seedrandom from 'seedrandom';
import { FN_NATIVE, NULL, NUM } from '../../interpreter/value.js';
import { textEncoder } from '../../const.js';
import { SeedRandomWrapper } from './seedrandom.js';
import { ChaCha20 } from './chacha20.js';
import type { Value, VNativeFn, VNum, VStr } from '../../interpreter/value.js';

export function GenerateLegacyRandom(seed: VNum | VStr): VNativeFn {
	const rng = seedrandom(seed.value.toString());
	return FN_NATIVE(([min, max]) => {
		if (min && min.type === 'num' && max && max.type === 'num') {
			return NUM(Math.floor(rng() * (Math.floor(max.value) - Math.ceil(min.value) + 1) + Math.ceil(min.value)));
		}
		return NUM(rng());
	});
}

export function GenerateRC4Random(seed: VNum | VStr): VNativeFn {
	const rng = new SeedRandomWrapper(seed.value);
	return FN_NATIVE(([min, max]) => {
		if (min && min.type === 'num' && max && max.type === 'num') {
			const result = rng.generateRandomIntegerInRange(min.value, max.value);
			return typeof result === 'number' ? NUM(result) : NULL;
		}
		return NUM(rng.generateNumber0To1());
	});
}

export async function GenerateChaCha20Random(seed: VNum | VStr, options: Map<string, Value> | undefined): Promise<VNativeFn> {
	let actualSeed: Uint8Array;
	if (seed.type === 'num') {
		const float64Array = new Float64Array([seed.value]);
		const numberAsIntegerOptionValue = options?.get('chacha20_number_seed_legacy_behavior');
		let numberAsInteger = false;
		if (numberAsIntegerOptionValue?.type === 'bool') {
			numberAsInteger = numberAsIntegerOptionValue.value;
		}
		const seedToDigest = numberAsInteger ? new Uint8Array(float64Array) : new Uint8Array(float64Array.buffer);
		actualSeed = new Uint8Array(await crypto.subtle.digest('SHA-384', seedToDigest));
	} else {
		actualSeed = new Uint8Array(await crypto.subtle.digest('SHA-384', new Uint8Array(textEncoder.encode(seed.value))));
	}
	const rng = new ChaCha20(actualSeed);
	return FN_NATIVE(([min, max]) => {
		if (min && min.type === 'num' && max && max.type === 'num') {
			const result = rng.generateRandomIntegerInRange(min.value, max.value);
			return typeof result === 'number' ? NUM(result) : NULL;
		}
		return NUM(rng.generateNumber0To1());
	});
}
