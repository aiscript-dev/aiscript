/**
 * AiScript
 */

type VNull = {
	type: 'null';
	value: null;
};

type VBoolean = {
	type: 'boolean';
	value: boolean;
};

type VNumber = {
	type: 'number';
	value: number;
};

type VString = {
	type: 'string';
	value: string;
};

type VFunction = {
	type: 'function';
	args?: string[];
	statements?: Node[];
	native?: (args: Value[]) => Value | void;
};

export type Value = VNull | VBoolean | VNumber | VString | VFunction;

export type Node = {
	type: 'def'; // 変数宣言
	name: string; // 変数名
	expr: Node; // 式
} | {
	type: 'call'; // 関数呼び出し
	name: string; // 関数名
	args: Node[]; // 引数(式の配列)
} | {
	type: 'return'; // return
	expr: Node; // 式
} | {
	type: 'if'; // if文
	cond: Node; // 条件式
	then: Node[]; // if文のthen節
	elseif: {
		cond: Node;
		then: Node[];
	}[]; // if文のelseif節
	else: Node[]; // if文のelse節
} | {
	type: 'var'; // 変数
	name: string; // 変数名
} | {
	type: 'null'; // nullリテラル
	value: null; // null
} | {
	type: 'boolean'; // 真理値リテラル
	value: boolean; // 真理値
} | {
	type: 'number'; // 数値リテラル
	value: number; // 数値
} | {
	type: 'string'; // 文字列リテラル
	value: string; // 文字列
} | {
	type: 'func'; // 関数リテラル
	args: string[]; // 引数名
	children: Node[]; // 関数の本体処理
} | {
	type: 'object'; // オブジェクトリテラル
	object: {
		key: string; // キー
		value: Node; // バリュー(式)
	}[]; // オブジェクト
};

export const NULL = {
	type: 'null' as const,
	value: null
};
