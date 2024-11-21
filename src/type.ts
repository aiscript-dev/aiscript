import { AiScriptSyntaxError } from './error.js';
import type * as Ast from './node.js';

// Type (Semantic analyzed)

export type TSimple<N extends string = string> = {
	type: 'simple';
	name: N;
}

export function T_SIMPLE<T extends string>(name: T): TSimple<T> {
	return {
		type: 'simple',
		name: name,
	};
}

export function isAny(x: Type): x is TSimple<'any'> {
	return x.type === 'simple' && x.name === 'any';
}

export type TGeneric<N extends string = string> = {
	type: 'generic';
	name: N;
	inners: Type[];
}

export function T_GENERIC<N extends string>(name: N, inners: Type[]): TGeneric<N> {
	return {
		type: 'generic',
		name: name,
		inners: inners,
	};
}

export type TFn = {
	type: 'fn';
	params: Type[];
	result: Type;
};

export function T_FN(params: Type[], result: Type): TFn {
	return {
		type: 'fn',
		params,
		result,
	};
}

export type TParam = {
	type: 'param';
	name: string;
}

export function T_PARAM(name: string): TParam {
	return {
		type: 'param',
		name,
	};
}

export type Type = TSimple | TGeneric | TFn | TParam;

function assertTSimple(t: Type): asserts t is TSimple { if (t.type !== 'simple') { throw new TypeError('assertTSimple failed.'); } }
function assertTGeneric(t: Type): asserts t is TGeneric { if (t.type !== 'generic') { throw new TypeError('assertTGeneric failed.'); } }
function assertTFn(t: Type): asserts t is TFn { if (t.type !== 'fn') { throw new TypeError('assertTFn failed.'); } }

// Utility

export function isCompatibleType(a: Type, b: Type): boolean {
	if (isAny(a) || isAny(b)) return true;
	if (a.type !== b.type) return false;

	switch (a.type) {
		case 'simple': {
			assertTSimple(b); // NOTE: TypeGuardが効かない
			if (a.name !== b.name) return false;
			break;
		}
		case 'generic': {
			assertTGeneric(b); // NOTE: TypeGuardが効かない
			// name
			if (a.name !== b.name) return false;
			// inners
			if (a.inners.length !== b.inners.length) return false;
			for (let i = 0; i < a.inners.length; i++) {
				if (!isCompatibleType(a.inners[i]!, b.inners[i]!)) return false;
			}
			break;
		}
		case 'fn': {
			assertTFn(b); // NOTE: TypeGuardが効かない
			// fn result
			if (!isCompatibleType(a.result, b.result)) return false;
			// fn parameters
			if (a.params.length !== b.params.length) return false;
			for (let i = 0; i < a.params.length; i++) {
				if (!isCompatibleType(a.params[i]!, b.params[i]!)) return false;
			}
			break;
		}
		case 'param': {
			// TODO
			break;
		}
	}

	return true;
}

export function getTypeName(type: Type): string {
	switch (type.type) {
		case 'simple': {
			return type.name;
		}
		case 'generic': {
			return `${type.name}<${type.inners.map(inner => getTypeName(inner)).join(', ')}>`;
		}
		case 'fn': {
			return `@(${type.params.map(param => getTypeName(param)).join(', ')}) { ${getTypeName(type.result)} }`;
		}
		case 'param': {
			return type.name;
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
			const params = typeSource.params.map(param => getTypeNameBySource(param)).join(', ');
			const result = getTypeNameBySource(typeSource.result);
			return `@(${params}) { ${result} }`;
		}
	}
}

export function getTypeBySource(typeSource: Ast.TypeSource, typeParams?: readonly Ast.TypeParam[]): Type {
	if (typeSource.type === 'namedTypeSource') {
		const typeParam = typeParams?.find((param) => param.name === typeSource.name);
		if (typeParam != null) {
			return T_PARAM(typeParam.name);
		}

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
					innerType = getTypeBySource(typeSource.inner, typeParams);
				} else {
					innerType = T_SIMPLE('any');
				}
				return T_GENERIC(typeSource.name, [innerType]);
			}
		}
		throw new AiScriptSyntaxError(`Unknown type: '${getTypeNameBySource(typeSource)}'`, typeSource.loc.start);
	} else {
		const paramTypes = typeSource.params.map(param => getTypeBySource(param));
		return T_FN(paramTypes, getTypeBySource(typeSource.result));
	}
}
