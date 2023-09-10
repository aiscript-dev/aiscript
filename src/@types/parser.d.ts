import type { Cst } from '../index.js';

declare module '*/parser.js' {
	// FIXME: 型指定が効いていない
	export const parse: (input: string, options: object) => Cst.Node[];
}
