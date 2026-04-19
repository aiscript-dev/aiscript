export function filter<T, U extends T>(
	iterable: Iterable<T, unknown, undefined>,
	predicate: (value: T) => value is U
): IteratorObject<U, undefined, unknown>;
export function filter<T>(
	iterable: Iterable<T, unknown, undefined>,
	predicate: (value: T) => boolean
): IteratorObject<T, undefined, unknown>;
export function* filter<T>(
	iterable: Iterable<T, unknown, undefined>,
	predicate: (value: T) => boolean
): IteratorObject<T, undefined, unknown> {
	for (const value of iterable) {
		if (predicate(value)) {
			yield value;
		}
	}
}

export function* map<T, U>(
	iterable: Iterable<T, unknown, undefined>,
	mapper: (value: T) => U,
): IteratorObject<U, undefined, unknown> {
	for (const value of iterable) {
		yield mapper(value);
	}
}
