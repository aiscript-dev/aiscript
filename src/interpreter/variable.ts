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
  })
	& {
		type?: Type
	}

export const Variable = {
	mut(value: Value, opts?: { type?: Type }): Variable {
		return {
			isMutable: true,
			value,
			type: opts?.type,
		};
	},
	const(value: Value, opts?: { type?: Type }): Variable {
		return {
			isMutable: false,
			value,
			type: opts?.type,
		};
	},
};
