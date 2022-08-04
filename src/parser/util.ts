export function group<T>(arr: T[], predicate: (prev: T, curr: T) => boolean): T[][] {
	const dest: T[][] = [];
	for (let i = 0; i < arr.length; i++) {
		if (i !== 0 && predicate(arr[i - 1], arr[i])) {
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
