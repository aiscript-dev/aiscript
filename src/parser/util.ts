import * as Ast from '../node';

export function group<T>(arr: T[], predicate: (prev: T, curr: T) => boolean): T[][] {
	const dest: T[][] = [];
	for (let i = 0; i < arr.length; i++) {
		if (i != 0 && predicate(arr[i - 1], arr[i])) {
			dest[dest.length - 1].push(arr[i]);
		} else {
			dest.push([arr[i]]);
		}
	}
	return dest;
}

export function ungroup<T>(groupes: T[][]): T[] {
	return groupes.reduce((acc, val) => acc.concat(val), []);
}

export function createNode(type: string, params: Record<string, any>) {
	const node: Record<string, any> = { type };
	for (const key of Object.keys(params)) {
		if (params[key] !== undefined) {
			node[key] = params[key];
		}
	}
	//const loc = location();
	//node.loc = { start: loc.start.offset, end: loc.end.offset - 1 };
	return node;
}

export function N_STR(value: Ast.NStr['value']) {
	return createNode('str', { value }) as Ast.NStr;
}

export function N_TMPL(tmpl: Ast.NTmpl['tmpl']) {
	return createNode('tmpl', { tmpl }) as Ast.NTmpl;
}

export function N_NUM(value: Ast.NNum['value']) {
	return createNode('num', { value }) as Ast.NNum;
}

export function N_TRUE() {
	return createNode('bool', { value: true }) as Ast.NBool;
}

export function N_FALSE() {
	return createNode('bool', { value: false }) as Ast.NBool;
}

export function N_NULL() {
	return createNode('null', {}) as Ast.NNull;
}

export function N_DEF(name: Ast.NDef['name'], varType: Ast.NDef['varType'], expr: Ast.NDef['expr'], mut: Ast.NDef['mut'], attr: Ast.NDef['attr']) {
	return createNode('def', { name, varType, expr, mut, attr }) as Ast.NDef;
}
