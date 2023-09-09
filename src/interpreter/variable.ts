import type { Value } from './value.js';

export type Variable =
  | {
    isMutable: false
    readonly value: Value
  }
  | {
    isMutable: true
    value: Value
  }

export const Variable = {
	mut(value: Value): Variable {
		return {
			isMutable: true,
			value,
		};
	},
	imut(value: Value): Variable {
		return {
			isMutable: false,
			value,
		};
	},
};
