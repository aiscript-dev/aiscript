// exhaustiveness checker function
export function mustBeNever<TExcept = never>(value: NoInfer<TExcept>, errormes: string): never {
	throw new Error(errormes);
}

// https://stackoverflow.com/questions/56687668/a-way-to-disable-type-argument-inference-in-generics
type NoInfer<T> = [T][T extends unknown ? 0 : never];
