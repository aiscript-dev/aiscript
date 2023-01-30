import { SyntaxError } from './error';
import type * as Ast from './node';

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
	args: Type[];
	result: Type;
};

export function T_FN(args: Type[], result: Type): TFn {
	return {
		type: 'fn',
		args,
		result,
	};
}

export type Type = TSimple | TGeneric | TFn;

// Utility

export function isCompatibleType(a: Type, b: Type): boolean {
	if (isAny(a) || isAny(b)) return true;
	if (a.type !== b.type) return false;

	switch (a.type) {
		case 'simple': {
			b = (b as TSimple); // NOTE: TypeGuardが効かない
			if (a.name !== b.name) return false;
			break;
		}
		case 'generic': {
			b = (b as TGeneric); // NOTE: TypeGuardが効かない
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
			b = (b as TFn);
			// fn result
			if (!isCompatibleType(a.result, b.result)) return false;
			// fn args
			if (a.args.length !== b.args.length) return false;
			for (let i = 0; i < a.args.length; i++) {
				if (!isCompatibleType(a.args[i]!, b.args[i]!)) return false;
			}
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
			return `${ type.name }<${ type.inners.map(inner => getTypeName(inner)).join(', ') }>`;
		}
		case 'fn': {
			return `@(${ type.args.map(arg => getTypeName(arg)).join(', ') }) { ${ getTypeName(type.result) } }`;
		}
	}
}

export function getTypeNameBySource(typeSource: Ast.TypeSource): string {
	switch (typeSource.type) {
		case 'namedTypeSource': {
			if (typeSource.inner) {
				const inner = getTypeNameBySource(typeSource.inner);
				return `${ typeSource.name }<${ inner }>`;
			} else {
				return typeSource.name;
			}
		}
		case 'fnTypeSource': {
			const args = typeSource.args.map(arg => getTypeNameBySource(arg)).join(', ');
			const result = getTypeNameBySource(typeSource.result);
			return `@(${ args }) { ${ result } }`;
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
		throw new SyntaxError(`Unknown type: '${ getTypeNameBySource(typeSource) }'`);
	} else {
		const argTypes = typeSource.args.map(arg => getTypeBySource(arg));
		return T_FN(argTypes, getTypeBySource(typeSource.result));
	}
}
