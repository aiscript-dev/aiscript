export function group<T>(arr: T[], predicate: (prev: T, current: T) => boolean): T[][] {
	const dest: any[][] = [];

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

export function concatTemplate(arr: any[]) {
	let groupes = group(arr, (prev, current) => (typeof current == typeof prev));

	// concat string
	groupes = groupes.map(g => {
		if (typeof g[0] == 'string') {
			return [g.join('')];
		}
		return g;
	});

	return ungroup(groupes);
}
