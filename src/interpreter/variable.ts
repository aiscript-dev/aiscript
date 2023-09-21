import type { Value } from './value.js';
import type { Type } from '../type.js';

export type Variable = (
  | {
    isMutable: false
    readonly value: Value
  }
  | {
    isMutable: true
    value: Value
  }
)	& {
	type?: Type
	attrs?: Attr[];
};
export type Attr = {
	name: string;
	value: Value;
};

export const Variable = {
	mut(value: Value, opts?: { type?: Type, attrs?: Attr[] }): Variable {
		return {
			isMutable: true,
			value,
			...opts,
		};
	},
	const(value: Value, opts?: { type?: Type, attrs?: Attr[] }): Variable {
		return {
			isMutable: false,
			value,
			...opts,
		};
	},
};
