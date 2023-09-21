import { AiScriptTypeError } from './error.js';
import type * as Ast from './node.js';

// Types (Semantically analyzed)

export type Type = TSimple | TGeneric | TFn;

export type TSimple<N extends string = string> = {
	type: 'simple';
	name: N;
}

export type TGeneric<N extends string = string> = {
	type: 'generic';
	name: N;
	inners: Type[];
}

export type TFn = {
	type: 'fn';
	args: Type[];
	result: Type;
};

export function T_SIMPLE<T extends string>(name: T): TSimple<T> {
	return {
		type: 'simple',
		name: name,
	};
}

export function T_GENERIC<N extends string>(name: N, inners: Type[]): TGeneric<N> {
	return {
		type: 'generic',
		name: name,
		inners: inners,
	};
}

export function T_FN(args: Type[], result: Type): TFn {
	return {
		type: 'fn',
		args,
		result,
	};
}

function isTSimple(x: Type): x is TSimple { return x.type === 'simple'; }
function isTGeneric(x: Type): x is TGeneric { return x.type === 'generic'; }
function isTFn(x: Type): x is TFn { return x.type === 'fn'; }
function isAny(x: Type): x is TSimple<'any'> { return x.type === 'simple' && x.name === 'any'; }

// Utility

export function isCompatibleType(a: Type, b: Type): boolean {
	if (isAny(a) || isAny(b)) return true;

	// isTSimple系のif文で分岐すると網羅性チェックができない？
	switch (a.type) {
		case 'simple' :
			if (!isTSimple(b)) return false;
			if (!(a.name === b.name)) return false;
			return true;

		case 'generic' :
			if (!isTGeneric(b)) return false;
			if (!(a.name === b.name)) return false;
			if (!(a.inners.length !== b.inners.length)) return false;
			for (const i in a.inners) {
				if (!isCompatibleType(a.inners[i]!, b.inners[i]!)) return false;
			}
			return true;

		case 'fn' :
			if (!isTFn(b)) return false;
			if (!isCompatibleType(a.result, b.result)) return false;
			if (!(a.args.length !== b.args.length)) return false;
			for (const i in a.args) {
				if (!isCompatibleType(a.args[i]!, b.args[i]!)) return false;
			}
			return true;
	}
}

/**
 * Type to string representation
 */
export function getTypeName(type: Type): string {
	switch (type.type) {
		case 'simple': {
			return type.name;
		}
		case 'generic': {
			return `${type.name}<${type.inners.map(inner => getTypeName(inner)).join(', ')}>`;
		}
		case 'fn': {
			return `@(${type.args.map(arg => getTypeName(arg)).join(', ')}) { ${getTypeName(type.result)} }`;
		}
	}
}

export function getTypeNameBySource(typeSource: Ast.TypeSource): string {
	switch (typeSource.type) {
		case 'namedTypeSource': {
			if (typeSource.inner) {
				const inner = getTypeNameBySource(typeSource.inner);
				return `${typeSource.name}<${inner}>`;
			} else {
				return typeSource.name;
			}
		}
		case 'fnTypeSource': {
			const args = typeSource.args.map(arg => getTypeNameBySource(arg)).join(', ');
			const result = getTypeNameBySource(typeSource.result);
			return `@(${args}) { ${result} }`;
		}
	}
}

export function getTypeBySource(typeSource: Ast.TypeSource): Type {
	if (typeSource.type === 'namedTypeSource') {
		switch (typeSource.name) {
			// simple types
			case 'null':
			case 'bool':
			case 'num':
			case 'str':
			case 'any':
			case 'void': {
				if (typeSource.inner == null) {
					return T_SIMPLE(typeSource.name);
				}
				break;
			}
			// alias for Generic types
			case 'arr':
			case 'obj': {
				let innerType: Type;
				if (typeSource.inner != null) {
					innerType = getTypeBySource(typeSource.inner);
				} else {
					innerType = T_SIMPLE('any');
				}
				return T_GENERIC(typeSource.name, [innerType]);
			}
		}
		throw new AiScriptTypeError(`Unknown type: '${getTypeNameBySource(typeSource)}'`);
	} else {
		const argTypes = typeSource.args.map(arg => getTypeBySource(arg));
		return T_FN(argTypes, getTypeBySource(typeSource.result));
	}
}
