export function deepEqual(a: unknown, b: unknown): boolean {
	return deepEqualRefs(a, b, [], []);
}

function deepEqualRefs(a: unknown, b: unknown, refsA: unknown[], refsB: unknown[]): boolean {
	// プリミティブ値や参照の比較
	// NOTE: Object.is()はNaN同士の比較でもtrue
	if (Object.is(a, b)) return true;

	// Object (a、b共にnullは含まない)
	if (a !== null && b !== null && typeof a === 'object' && typeof b === 'object') {
		// 参照の循環をチェック
		// 両方の循環が確認された時点で、その先も一致すると保証できるためtrueで返す
		const indexA = refsA.findIndex(x => x === a);
		const indexB = refsB.findIndex(x => x === b);
		if (indexA !== -1 && indexB !== -1) {
			return true;
		}

		// 次の参照パスを生成
		const nextRefsA = [...refsA, a];
		const nextRefsB = [...refsB, b];

		// Array
		if (Array.isArray(a) && Array.isArray(b)) {
			if (a.length !== b.length) return false;
			for (let i = 0; i < a.length; i++) {
				if (!deepEqualRefs(a[i], b[i], nextRefsA, nextRefsB)) return false;
			}
			return true;
		}

		// Map
		if (a instanceof Map && b instanceof Map) {
			if (a.size !== b.size) return false;
			const aEntries = a.entries();
			const bEntries = b.entries();
			for (let i = 0; i < a.size; i++) {
				const entryA = aEntries.next();
				const entryB = bEntries.next();
				if (!deepEqualRefs(entryA.value[0], entryB.value[0], nextRefsA, nextRefsB)) return false;
				if (!deepEqualRefs(entryA.value[1], entryB.value[1], nextRefsA, nextRefsB)) return false;
			}
			return true;
		}

		// Set
		if (a instanceof Set && b instanceof Set) {
			if (a.size !== b.size) return false;
			const aValues = a.values();
			const bValues = b.values();
			for (let i = 0; i < a.size; i++) {
				const valueA = aValues.next();
				const valueB = bValues.next();
				if (!deepEqualRefs(valueA.value, valueB.value, nextRefsA, nextRefsB)) return false;
			}
			return true;
		}

		// object keys
		const keysA = Object.keys(a);
		const keysB = Object.keys(b);
		if (keysA.length !== keysB.length) return false;
		for (const key of keysA) {
			if (!deepEqualRefs((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key], nextRefsA, nextRefsB)) return false;
		}
		return true;
	}

	return false;
}
