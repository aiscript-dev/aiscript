export type TNull = {
	name: 'null';
};

export function T_NULL(): TNull {
	return {
		name: 'null' as const
	};
}

export type TBool = {
	name: 'bool';
};

export function T_BOOL(): TBool {
	return {
		name: 'bool' as const
	};
}

export type TNum = {
	name: 'num';
};

export function T_NUM(): TNum {
	return {
		name: 'num' as const
	};
}

export type TStr = {
	name: 'str';
};

export function T_STR(): TStr {
	return {
		name: 'str' as const
	};
}

export type TArr = {
	name: 'arr';
	item: Type;
};

export function T_ARR(item: Type): TArr {
	return {
		name: 'arr' as const,
		item: item
	};
}

export type TObj = {
	name: 'obj';
	value: Type;
};

export function T_OBJ(value: Type): TObj {
	return {
		name: 'obj' as const,
		value: value
	};
}

export type TFn = {
	name: 'fn';
	args: Type[];
	result: Type;
};

export function T_FN(args: Type[], result: Type): TFn {
	return {
		name: 'fn' as const,
		args,
		result
	};
}

export type TAny = {
	name: 'any';
};

export function T_ANY(): TAny {
	return {
		name: 'any' as const
	};
}

export type Type = TNull | TBool | TNum | TStr | TArr | TObj | TFn | TAny;

export function getTypeByName(x: string) {
	switch (x) {
		case 'null':
			return T_NULL();
		case 'bool':
			return T_BOOL();
		case 'num':
			return T_NUM();
		case 'str':
			return T_STR();
		case 'obj':
			return T_OBJ();
		case 'arr':
			return T_ARR(T_ANY());
		case 'fn':
			return T_FN([], T_ANY());
		case 'any':
			return T_ANY();
	}
	return null;
}

export function compatibleType(a: Type, b: Type): boolean {
	if (a.name == 'any' || b.name == 'any') return true;
	if (a.name != b.name) return false;

	switch (a.name) {

		case 'arr': {
			b = (b as TArr); // NOTE: TypeGuardが効かない
			return compatibleType(a.item, b.item);
		}

		case 'fn': {
			b = (b as TFn); // NOTE: TypeGuardが効かない
			// fn result
			if (!compatibleType(a.result, b.result)) return false;
			// fn args
			if (a.args.length != b.args.length) return false;
			for (let i = 0; i < a.args.length; i++) {
				if (!compatibleType(a.args[i], b.args[i])) return false;
			}
			return true;
		}

		case 'obj': {
			break;
		}

	}

	return true;
}

export function getTypeName(type: Type): string {

	switch (type.name) {

		case 'arr': {
			if (type.item.name != 'any') {
				return `arr<${type.item.name}>`;
			}
			break;
		}

		case 'fn': {
			const args = type.args.map(arg => getTypeName(arg)).join(', ');
			const result = getTypeName(type.result);
			return `@(${args}) => ${result}`;
		}

	}

	return type.name;
}
