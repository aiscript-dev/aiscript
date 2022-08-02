import * as T from 'terrario';
import { createNode, group, ungroup } from './util';

const space = T.regexp(/[ \t]/);
const spacing = T.alt([space, T.newline]).many(0);
const endOfLine = T.alt([T.newline, T.eof]);

const language = T.createLanguage({
	preprocessorRoot: r => {
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

	parserRoot: r => {
		const separator = T.seq([
			space.many(0),
			T.newline,
			spacing,
		]);

		const statements = T.sep(r.statement, separator, 1);
		return T.seq([
			T.alt([space, T.newline]).many(0),
			T.alt([
				statements,
				T.succeeded([]),
			]),
			T.alt([space, T.newline]).many(0),
		], 1);
	},

	statement: r => T.alt([
		r.varDef,
	]),

	expr: r => T.alt([
		r.tmpl,
		r.str,
	]),

	// statements

	varDef: r => {
		const typePart = T.seq([
			spacing,
			T.str(':'),
			spacing,
			r.type,
		], 3);
		return T.alt([
			T.seq([
				T.str('let'),
				T.alt([space, T.newline]).many(1),
				r.identifier,
				typePart.option(),
				spacing,
				T.str('='),
				spacing,
				r.expr,
			]).map(values => {
				return createNode('def', { name: values[2], varType: values[3] ?? undefined, expr: values[7], mut: false, attr: [] });
			}),
			T.seq([
				T.str('var'),
				T.alt([space, T.newline]).many(1),
				r.identifier,
				typePart.option(),
				spacing,
				T.str('='),
				spacing,
				r.expr,
			]).map(values => {
				return createNode('def', { name: values[2], varType: values[3] ?? undefined, expr: values[7], mut: true, attr: [] });
			}),
		]);
	},

	// expressions

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
			], 1).many(0),
			T.str('`'),
		], 1).map(value => {
			return createNode('tmpl', { tmpl: concatTemplate(value) });
		});
	},

	// utility

	identifier: r => T.seq([
		T.regexp(/[a-z_]/i),
		T.regexp(/[a-z0-9_]/i).many(0),
	]).text(),
});

export function parse(input: string) {
	let result;

	result = language.preprocessorRoot.parse(input);
	if (!result.success) {
		throw new Error('syntax error: preprocess fails');
	}

	result = language.parserRoot.parse(result.value);
	if (!result.success) {
		throw new Error('syntax error');
	}

	return result.value;
}
