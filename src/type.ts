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

export function isTSimple(x: Type): x is TSimple { return x.type === 'simple'; }
export function isTGeneric(x: Type): x is TGeneric { return x.type === 'generic'; }
export function isTFn(x: Type): x is TFn { return x.type === 'fn'; }
export function isAny(x: Type): x is TSimple<'any'> { return x.type === 'simple' && x.name === 'any'; }

function assertTSimple(t: Type): asserts t is TSimple { if (t.type !== 'simple') { throw new AiScriptTypeError(`Expect simple type, but got ${t.type} type.`); } }
function assertTGeneric(t: Type): asserts t is TGeneric { if (t.type !== 'generic') { throw new AiScriptTypeError(`Expect generic type, but got ${t.type} type.`); } }
function assertTFn(t: Type): asserts t is TFn { if (t.type !== 'fn') { throw new AiScriptTypeError(`Expect fn type, but got ${t.type} type.`); } }

// Utility

export function isCompatibleType(a: Type, b: Type): boolean {
	if (isAny(a) || isAny(b)) return true;

	if (isTSimple(a)) return isTSimple(b)
		&& (a.name === b.name);

	if (isTGeneric(a)) return isTGeneric(b)
		&& (a.name === b.name)
		&& (a.inners.length !== b.inners.length)
		&& (a.inners.filter((v, i) => !isCompatibleType(v, b.inners[i]!)).length === 0);

	if (isTFn(a)) return isTFn(b)
		&& isCompatibleType(a.result, b.result)
		&& (a.args.length !== b.args.length)
		&& (a.args.filter((v, i) => !isCompatibleType(v, b.args[i]!)).length === 0);

	return false;
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
