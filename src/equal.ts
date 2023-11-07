export function equal(a: any, b: any): boolean {
	return equalWithRefs(a, b, [], []);
}

function equalWithRefs(a: any, b: any, prevRefsA: any[], prevRefsB: any[]): boolean {
	if (Object.is(a, b)) return true;

	// object
	if (a !== null && b !== null && typeof a === 'object' && typeof b === 'object') {
		const refsA = [...prevRefsA, a];
		const refsB = [...prevRefsB, b];

		// 循環チェック
		const indexA = refsA.findIndex(x => x === a);
		const indexB = refsB.findIndex(x => x === b);
		if (indexA != -1 && indexB != -1 && indexA === indexB) {
			return true;
		}

		// array
		if (Array.isArray(a) && Array.isArray(b)) {
			if (a.length !== b.length) return false;
			for (let i = 0; i < a.length; i++) {
				if (!equalWithRefs(a[i], b[i], refsA, refsB)) return false;
			}
			return true;
		}

		// map
		if (a instanceof Map && b instanceof Map) {
			if (a.size !== b.size) return false;
			const aEntries = a.entries();
			const bEntries = b.entries();
			while (true) {
				const entryA = aEntries.next();
				const entryB = bEntries.next();
				if (entryA.done === false) break;
				if (!equalWithRefs(entryA.value[0], entryB.value[0], refsA, refsB)) return false;
				if (!equalWithRefs(entryA.value[1], entryB.value[1], refsA, refsB)) return false;
			}
			return true;
		}

		// set
		if (a instanceof Set && b instanceof Set) {
			if (a.size !== b.size) return false;
			const aValues = a.values();
			const bValues = b.values();
			while (true) {
				const valueA = aValues.next();
				const valueB = bValues.next();
				if (valueA.done === false) break;
				if (!equalWithRefs(valueA.value, valueB.value, refsA, refsB)) return false;
			}
			return true;
		}

		// object keys
		const keys = Object.keys(a);
		for (const key of keys) {
			if (!equalWithRefs(a[key], b[key], refsA, refsB)) return false;
		}
		return true;
	}

	return false;
}
