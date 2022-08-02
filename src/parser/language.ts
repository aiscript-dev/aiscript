import * as T from 'terrario';

function group<T>(arr: T[], predicate: (prev: T, curr: T) => boolean): T[][] {
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

function ungroup<T>(groupes: T[][]): T[] {
	return groupes.reduce((acc, val) => acc.concat(val), []);
}

function createNode(type: string, params: Record<string, any>) {
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

const endOfLine = T.alt([T.newline, T.eof]);

const language = T.createLanguage({
	preprocess: r => {
		const commentLine = T.seq([
			T.str('//'),
			T.seq([
				T.notMatch(endOfLine),
				T.char,
			]).many(0),
		]);

		return T.alt([
			r.str.text(),
			r.tmpl.text(),
			commentLine.map(() => ''),
			T.char,
		]).many(0).map(values => {
			return values.join('');
		});
	},

	root: r => {
		const statements = T.sep(r.statement, T.newline, 1);
		return T.alt([
			statements,
			T.succeeded([]),
		]);
	},

	statement: r => T.alt([

	]),

	expr: r => T.alt([

	]),

	str: r => {
		const content = T.alt([
			T.str('\\"').map(() => '"'),
			T.char,
		]);

		return T.seq([
			T.str('"'),
			T.seq([
				T.notMatch(T.str('"')),
				content,
			]).many(0).text(),
			T.str('"'),
		], 1).map(value => {
			return createNode('str', { value: value });
		});
	},

	tmpl: r => {
		function concatTemplate(arr: any[]): any[] {
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

		const content = T.alt([
			T.str('\\{').map(() => '{'),
			T.str('\\}').map(() => '}'),
			T.str('\\`').map(() => '`'),
			T.seq([
				T.str('{'), r.expr, T.str('}'),
			], 1),
			T.char,
		]);

		return T.seq([
			T.str('`'),
			T.seq([
				T.notMatch(T.str('`')),
				content,
			]).many(0),
			T.str('`'),
		], 1).map(value => {
			return createNode('tmpl', { tmpl: concatTemplate(value) });
		});
	},
});

export function parse(input: string) {
	let result;

	result = language.preprocess.parse(input);
	if (!result.success) {
		throw new Error('syntax error: preprocess fails');
	}

	result = language.root.parse(result.value);
	if (!result.success) {
		throw new Error('syntax error');
	}

	return result.value;
}
