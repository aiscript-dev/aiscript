import seedrandom from 'seedrandom';
import { FN_NATIVE, NULL, NUM } from '../../interpreter/value.js';
import { SeedRandomWrapper } from './seedrandom.js';
import { ChaCha20 } from './chacha20.js';
import type { VNativeFn, VNull, Value } from '../../interpreter/value.js';
import { textEncoder } from '../../const.js';

export function GenerateLegacyRandom(seed: Value | undefined) : VNativeFn | VNull {
	if (!seed || seed.type !== 'num' && seed.type !== 'str') return NULL;
	const rng = seedrandom(seed.value.toString());
	return FN_NATIVE(([min, max]) => {
		if (min && min.type === 'num' && max && max.type === 'num') {
			return NUM(Math.floor(rng() * (Math.floor(max.value) - Math.ceil(min.value) + 1) + Math.ceil(min.value)));
		}
		return NUM(rng());
	});
}

export function GenerateRC4Random(seed: Value | undefined) : VNativeFn | VNull {
	if (!seed || seed.type !== 'num' && seed.type !== 'str') return NULL;
	const rng = new SeedRandomWrapper(seed.value);
	return FN_NATIVE(([min, max]) => {
		if (min && min.type === 'num' && max && max.type === 'num') {
			const result = rng.generateRandomIntegerInRange(min.value, max.value);
			return typeof result === 'number' ? NUM(result) : NULL;
		}
		return NUM(rng.generateNumber0To1());
	});
}

export async function GenerateChaCha20Random(seed: Value | undefined) : Promise<VNativeFn | VNull> {
	if (!seed || seed.type !== 'num' && seed.type !== 'str' && seed.type !== 'null') return NULL;
	let actualSeed : Uint8Array | undefined = undefined;
	if (seed.type === 'num')
	{
		actualSeed = new Uint8Array(await crypto.subtle.digest('SHA-384', new Uint8Array(new Float64Array([seed.value]))));
	} else if (seed.type === 'str') {
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
