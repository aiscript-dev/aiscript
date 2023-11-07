export function deepEqual(a: any, b: any): boolean {
	return deepEqualRefs(a, b, [], []);
}

function deepEqualRefs(a: any, b: any, prevRefsA: any[], prevRefsB: any[]): boolean {
	if (Object.is(a, b)) return true;

	// object
	if (a !== null && b !== null && typeof a === 'object' && typeof b === 'object') {
		const refsA = [...prevRefsA, a];
		const refsB = [...prevRefsB, b];

		// 循環チェック
		const indexA = prevRefsA.findIndex(x => x === a);
		const indexB = prevRefsB.findIndex(x => x === b);
		if (indexA !== -1 && indexB !== -1 && indexA === indexB) {
			return true;
		}

		// array
		if (Array.isArray(a) && Array.isArray(b)) {
			if (a.length !== b.length) return false;
			for (let i = 0; i < a.length; i++) {
				if (!deepEqualRefs(a[i], b[i], refsA, refsB)) return false;
			}
			return true;
		}

		// map
		if (a instanceof Map && b instanceof Map) {
			if (a.size !== b.size) return false;
			const aEntries = a.entries();
			const bEntries = b.entries();
			for (let i = 0; i < a.size; i++) {
				const entryA = aEntries.next();
				const entryB = bEntries.next();
				if (!deepEqualRefs(entryA.value[0], entryB.value[0], refsA, refsB)) return false;
				if (!deepEqualRefs(entryA.value[1], entryB.value[1], refsA, refsB)) return false;
			}
			return true;
		}

		// set
		if (a instanceof Set && b instanceof Set) {
			if (a.size !== b.size) return false;
			const aValues = a.values();
			const bValues = b.values();
			for (let i = 0; i < a.size; i++) {
				const valueA = aValues.next();
				const valueB = bValues.next();
				if (!deepEqualRefs(valueA.value, valueB.value, refsA, refsB)) return false;
			}
			return true;
		}

		// object keys
		const keys = Object.keys(a);
		for (const key of keys) {
			if (!deepEqualRefs(a[key], b[key], refsA, refsB)) return false;
		}
		return true;
	}

	return false;
}
