import * as T from 'terrario';
import * as Ast from '../node';
import { group, ungroup } from './util';

const space = T.regexp(/[ \t]/);
const spacing = T.alt([space, T.newline]).many(0);
const endOfLine = T.alt([T.newline, T.eof]);
const keywordAfter = T.lazy(() => T.regexp(/[a-z0-9_:]/i));

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

	// propAssign
	// indexAssign
	// indexRef
	// propCall
	// propRef
	// varRef

	statement: r => T.alt([
		r.varDef,
		// r.fnDef,
		r.out,
		r.return,
		// r.attr,
		// r.forOf,
		// r.for,
		// r.loop,
		r.break,
		r.continue,
		// r.assign,
		// r.inc,
		// r.dec,
		// r.expr,
	]),

	expr: r => T.alt([
		// r.if,
		// r.fn,
		// r.match,
		// r.blockExpr,
		r.tmpl,
		r.str,
		r.num,
		r.bool,
		r.null,
		r.obj,
		// r.arr,
		// r.call,
		// group
	]),

	//#region statements

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
				return Ast.DEF(values[2], values[7], false, { varType: values[3] ?? undefined });
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
				return Ast.DEF(values[2], values[7], true, { varType: values[3] ?? undefined });
			}),
		]);
	},

	out: r => T.seq([
		T.str('<:'),
		spacing,
		r.expr,
	], 2).map(value => {
		return Ast.CALL('print', [value]);
	}),

	return: r => T.seq([
		T.str('return'),
		T.alt([space, T.newline]).many(1),
		r.expr,
	]).map(values => Ast.RETURN(values[3])),

	break: r => T.seq([
		T.str('break'),
		T.notMatch(keywordAfter),
	]).map(() => Ast.BREAK()),

	continue: r => T.seq([
		T.str('continue'),
		T.notMatch(keywordAfter),
	]).map(() => Ast.CONTINUE()),

	//#endregion statements

	//#region expressions

	tmpl: r => {
		function concatTemplate(arr: any[]): any[] {
			let groupes = group(arr, (prev, current) => (typeof current === typeof prev));
			// concat string
			groupes = groupes.map(g => {
				if (typeof g[0] === 'string') {
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
			return Ast.TMPL(concatTemplate(value));
		});
	},

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
			return Ast.STR(value);
		});
	},

	num: r => {
		const float = T.seq([
			T.regexp(/[+-]/).option(),
			T.alt([
				T.regexp(/[1-9][0-9]+/),
				T.regexp(/[0-9]/),
			]),
			T.str('.'),
			T.regexp(/[0-9]+/),
		]).text().map(value => {
			return Ast.NUM(Number(value));
		});
	
		const int = T.seq([
			T.regexp(/[+-]/).option(),
			T.alt([
				T.regexp(/[1-9][0-9]+/),
				T.regexp(/[0-9]/),
			]),
		]).text().map(value => {
			return Ast.NUM(Number(value));
		});

		return T.alt([
			float,
			int,
		]);
	},

	bool: r => {
		const trueParser = T.seq([
			T.str('true'),
			T.notMatch(keywordAfter),
		]).map(() => Ast.TRUE());
	
		const falseParser = T.seq([
			T.str('false'),
			T.notMatch(keywordAfter),
		]).map(() => Ast.FALSE());

		return T.alt([
			trueParser,
			falseParser,
		]);
	},

	null: r => {
		return T.seq([
			T.str('null'),
			T.notMatch(keywordAfter),
		]).map(() => Ast.NULL());
	},

	obj: r => {
		type Entry = { key: unknown; value: unknown; };

		const entry = T.seq([
			r.identifier,
			spacing,
			T.str(':'),
			spacing,
			r.expr,
		]).map((values: unknown[]) => {
			return { key: values[0], value: values[4] } as Entry;
		});

		const separator = T.alt([
			T.seq([
				spacing,
				T.alt([
					T.str(','),
					T.str(';'),
				]),
				spacing,
			]),
			T.alt([space, T.newline]).many(1),
		]);

		return T.seq([
			T.str('{'),
			spacing,
			T.seq([
				T.sep(entry, separator, 1),
				separator.option(),
			], 0).option(),
			spacing,
			T.str('}'),
		], 2).map((value: Entry[] | null) => {
			const pairs = value ?? [];
			const obj = new Map();
			for (const pair of pairs) {
				obj.set(pair.key, pair.value);
			}
			return Ast.OBJ(obj);
		});
	},

	//#endregion expressions

	//#region utility

	identifier: r => {
		return T.regexp(/[a-z_][a-z0-9_]*/i);
	},

	//#endregion utility

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
