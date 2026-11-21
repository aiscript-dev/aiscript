import { map } from '../utils/iterator.js';
import type { Variable } from './variable.js';
import type { Scope } from './scope.js';
import type { Value } from './value.js';

export type ExecResultOptions = {
	value?: boolean;
	variables?: boolean | string[];
};

type ExecResultConfig = {
	value: {
		condition: true;
		result: Value;
	};
	variables: {
		condition: true | string[];
		result: Map<string, Value>;
	};
};

export type ExecResult<T extends ExecResultOptions = ExecResultOptions> = {
	[K in keyof ExecResultOptions]?: ExecResultConfig[K]['result'];
} & {
	[K in RequiredKeys<T>]: ExecResultConfig[K]['result'];
};

type RequiredKeys<T extends ExecResultOptions> = {
	[K in Extract<keyof T, keyof ExecResultOptions>]: T[K] extends ExecResultConfig[K]['condition'] ? K : never;
}[Extract<keyof T, keyof ExecResultOptions>];

export function constructResult<T extends ExecResultOptions>(opts: T, lastExpressionValue: Value, scope: Scope): ExecResult<T> {
	const resultObj: ExecResult = {};
	if (opts.value) {
		resultObj.value = lastExpressionValue;
	}
	if (opts.variables != null && opts.variables !== false) {
		resultObj.variables = pickVariables(scope, opts.variables);
	}
	return resultObj as ExecResult<T>;
}

function pickVariables(scope: Scope, opt: Exclude<NonNullable<ExecResultOptions['variables']>, false>): Map<string, Value> {
	let vars: Map<string, Variable>;
	if (opt === true) {
		vars = scope.getAll();
	} else {
		vars = scope.getByNames(opt);
	}
	return new Map(map(vars, ([name, variable]) => [name, variable.value]));
}
