export function autobind<T extends (...args: never[]) => unknown>(target: object, key: string | symbol, descriptor: TypedPropertyDescriptor<T>): TypedPropertyDescriptor<T> {
	let fn = descriptor.value!;

	return {
		configurable: true,
		get(): T {
			const bound = fn.bind(this);

			Object.defineProperty(this, key, {
				configurable: true,
				writable: true,
				value: bound,
			});

			return bound;
		},
		set(newFn: T): void {
			fn = newFn;
		},
	};
}
