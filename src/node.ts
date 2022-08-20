/**
 * IRノード
 *
 * IRノードはASTノードをインタプリタ等から操作しやすい構造に変形したものです。
*/

import { TypeSource } from './type';

export type Loc = {
	start: number;
	end: number;
};

export type Node = Namespace | Meta | Statement | Expression | StaticLiteral;
export type GlobalMember = Namespace | Meta | Statement | Expression;
export type NamespaceMember = Definition | Namespace;

export type Statement =
	Definition |
	Return |
	Each |
	For |
	Loop |
	Break |
	Continue |
	Assign |
	AddAssign |
	SubAssign;

export type Expression =
	Infix |
	If |
	Fn |
	Match |
	Block |
	Tmpl |
	Str |
	Num |
	Bool |
	Null |
	Obj |
	Arr |
	Var |
	Call |
	Index |
	Prop;

export type StaticLiteral =
	Str |
	Num |
	Bool |
	Null |
	StaticObj |
	StaticArr;

export type ChainTarget =
	Fn |
	Match |
	Block |
	Tmpl |
	Str |
	Num |
	Bool |
	Null |
	Obj |
	Arr |
	Var |
	Call |
	Index |
	Prop;

type NodeBase = {
	loc?: { // コード位置
		start: number;
		end: number;
	};
};

export type Namespace = NodeBase & {
	type: 'ns'; // 名前空間
	name: string; // 空間名
	members: NamespaceMember[]; // メンバー
};

export type Meta = NodeBase & {
	type: 'meta'; // メタデータ定義
	name: string | null; // 名
	value: StaticLiteral; // 値
};

export type Definition = NodeBase & {
	type: 'def'; // 変数宣言文
	name: string; // 変数名
	varType?: TypeSource; // 変数の型
	expr: Expression; // 式
	mut: boolean; // ミュータブルか否か
	attr: Attribute[]; // 付加された属性
};

export type Attribute = NodeBase & {
	type: 'attr'; // 属性
	name: string; // 属性名
	value: StaticLiteral; // 値
};

export type Return = NodeBase & {
	type: 'return'; // return文
	expr: Expression; // 式
};

export type Each = NodeBase & {
	type: 'forOf'; // each文
	var: string; // イテレータ変数名
	items: Expression; // 配列
	for: Statement | Expression; // 本体処理
};

export type For = NodeBase & {
	type: 'for'; // for文
	var?: string; // イテレータ変数名
	from?: Expression; // 開始値
	to?: Expression; // 終値
	times?: Expression; // 回数
	for: Statement | Expression; // 本体処理
};

export type Loop = NodeBase & {
	type: 'loop'; // loop文
	statements: (Statement | Expression)[]; // 処理
};

export type Break = NodeBase & {
	type: 'break'; // break文
};

export type Continue = NodeBase & {
	type: 'continue'; // continue文
};

export type AddAssign = NodeBase & {
	type: 'inc'; // 加算代入文
	dest: Expression; // 代入先
	expr: Expression; // 式
};

export type SubAssign = NodeBase & {
	type: 'dec'; // 減算代入文
	dest: Expression; // 代入先
	expr: Expression; // 式
};

export type Assign = NodeBase & {
	type: 'assign'; // 代入文
	dest: Expression; // 代入先
	expr: Expression; // 式
};

export type InfixOperator = "||" | "&&" | "==" | "!=" | "<=" | ">=" | "<" | ">" | "+" | "-" | "*" | "|" | "%";

// TODO: remove by transform plugin
export type Infix = NodeBase & {
	type: 'infix'; // 中置演算子式
	operands: Expression[]; // 項のリスト
	operators: InfixOperator[]; // 演算子のリスト
};

export type If = NodeBase & {
	type: 'if'; // if式
	cond: Expression; // 条件式
	then: Statement | Expression; // then節
	elseif: {
		cond: Expression; // elifの条件式
		then: Statement | Expression;// elif節
	}[];
	else?: Statement | Expression; // else節
};

export type Fn = NodeBase & {
	type: 'fn'; // 関数
	args: {
		name: string; // 引数名
		type?: TypeSource; // 引数の型
	}[];
	ret?: TypeSource; // 戻り値の型
	children: (Statement | Expression)[]; // 本体処理
};

export type Match = NodeBase & {
	type: 'match'; // パターンマッチ
	about: Expression; // 対象
	qs: {
		q: Expression; // 条件
		a: Statement | Expression; // 結果
	}[];
	default?: Statement | Expression; // デフォルト値
};

export type Block = NodeBase & {
	type: 'block'; // ブロックまたはeval式
	statements: (Statement | Expression)[]; // 処理
};

export type Tmpl = NodeBase & {
	type: 'tmpl'; // テンプレート
	tmpl: (string | Expression)[]; // 処理
};

export type Str = NodeBase & {
	type: 'str'; // 文字列リテラル
	value: string; // 文字列
};

export type Num = NodeBase & {
	type: 'num'; // 数値リテラル
	value: number; // 数値
};

export type Bool = NodeBase & {
	type: 'bool'; // 真理値リテラル
	value: boolean; // 真理値
};

export type Null = NodeBase & {
	type: 'null'; // nullリテラル
};

export type Obj = NodeBase & {
	type: 'obj'; // オブジェクト
	value: Map<string, Expression>; // プロパティ
};

export type Arr = NodeBase & {
	type: 'arr'; // 配列
	value: Expression[]; // アイテム
};

export type Var = NodeBase & {
	type: 'var'; // 変数
	name: string; // 変数名
};

export type StaticObj = NodeBase & {
	type: 'obj'; // 静的なオブジェクト
	value: Map<string, StaticLiteral>; // プロパティ
};

export type StaticArr = NodeBase & {
	type: 'arr'; // 静的な配列
	value: StaticLiteral[]; // アイテム
};

// chain node example:
// call > fn
// call > var(fn)
// index > arr
// index > var(arr)
// prop > prop(obj) > var(obj)
// call > prop(fn) > obj

export type Call = NodeBase & {
	type: 'call'; // 関数呼び出し
	target: ChainTarget; // 対象
	args: Expression[]; // 引数
};

export type Index = NodeBase & {
	type: 'index'; // 配列要素アクセス
	target: ChainTarget; // 対象
	index: Expression; // インデックス
};

export type Prop = NodeBase & {
	type: 'prop'; // プロパティアクセス
	target: ChainTarget; // 対象
	name: string; // プロパティ名
};
