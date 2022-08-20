/**
 * IRノード
 * 
 * 詳しくはASTノードの説明を参照してください。
*/

import { TypeSource } from '../type';

export type Node = GlobalMember | StaticLiteral;
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
	Eval |
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
	Eval |
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

type CoreProp = {
	loc?: { // コード位置
		start: number;
		end: number;
	};
};

export type Namespace = CoreProp & {
	type: 'ns'; // 名前空間
	name: string; // 空間名
	members: NamespaceMember[]; // メンバー
};

export type Meta = CoreProp & {
	type: 'meta'; // メタデータ定義
	name: string | null; // 名
	value: StaticLiteral; // 値
};

export type Definition = CoreProp & {
	type: 'def'; // 変数宣言文
	name: string; // 変数名
	varType?: TypeSource; // 変数の型
	expr: Expression; // 式
	mut: boolean; // ミュータブルか否か
	attr: Attribute[]; // 付加された属性
};

export type Attribute = CoreProp & {
	type: 'attr'; // 属性
	name: string; // 属性名
	value: StaticLiteral; // 値
};

export type Return = CoreProp & {
	type: 'return'; // return文
	expr: Expression; // 式
};

export type Each = CoreProp & {
	type: 'forOf'; // each文
	var: string; // イテレータ変数名
	items: Expression; // 配列
	for: Statement | Expression; // 本体処理
};

export type For = CoreProp & {
	type: 'for'; // for文
	var?: string; // イテレータ変数名
	from?: Expression; // 開始値
	to?: Expression; // 終値
	times?: Expression; // 回数
	for: Statement | Expression; // 本体処理
};

export type Loop = CoreProp & {
	type: 'loop'; // loop文
	statements: (Statement | Expression)[]; // 処理
};

export type Break = CoreProp & {
	type: 'break'; // break文
};

export type Continue = CoreProp & {
	type: 'continue'; // continue文
};

export type AddAssign = CoreProp & {
	type: 'inc'; // 加算代入文
	dest: Expression; // 代入先
	expr: Expression; // 式
};

export type SubAssign = CoreProp & {
	type: 'dec'; // 減算代入文
	dest: Expression; // 代入先
	expr: Expression; // 式
};

export type Assign = CoreProp & {
	type: 'assign'; // 代入文
	dest: Expression; // 代入先
	expr: Expression; // 式
};

export type InfixOperator = "||" | "&&" | "==" | "!=" | "<=" | ">=" | "<" | ">" | "+" | "-" | "*" | "|" | "%";

// TODO: remove by transform plugin
export type Infix = CoreProp & {
	type: 'infix'; // 中置演算子式
	operands: Expression[]; // 項のリスト
	operators: InfixOperator[]; // 演算子のリスト
};

export type If = CoreProp & {
	type: 'if'; // if式
	cond: Expression; // 条件式
	then: Statement | Expression; // then節
	elseif: {
		cond: Expression; // elifの条件式
		then: Statement | Expression;// elif節
	}[];
	else?: Statement | Expression; // else節
};

export type Fn = CoreProp & {
	type: 'fn'; // 関数
	args: {
		name: string; // 引数名
		type?: TypeSource; // 引数の型
	}[];
	ret?: TypeSource; // 戻り値の型
	children: (Statement | Expression)[]; // 本体処理
};

export type Match = CoreProp & {
	type: 'match'; // パターンマッチ
	about: Expression; // 対象
	qs: {
		q: Expression; // 条件
		a: Statement | Expression; // 結果
	}[];
	default?: Statement | Expression; // デフォルト値
};

export type Eval = CoreProp & {
	type: 'block'; // ブロックまたはeval式
	statements: (Statement | Expression)[]; // 処理
};

export type Tmpl = CoreProp & {
	type: 'tmpl'; // テンプレート
	tmpl: (string | Expression)[]; // 処理
};

export type Str = CoreProp & {
	type: 'str'; // 文字列リテラル
	value: string; // 文字列
};

export type Num = CoreProp & {
	type: 'num'; // 数値リテラル
	value: number; // 数値
};

export type Bool = CoreProp & {
	type: 'bool'; // 真理値リテラル
	value: boolean; // 真理値
};

export type Null = CoreProp & {
	type: 'null'; // nullリテラル
};

export type Obj = CoreProp & {
	type: 'obj'; // オブジェクト
	value: Map<string, Expression>; // プロパティ
};

export type Arr = CoreProp & {
	type: 'arr'; // 配列
	value: Expression[]; // アイテム
};

export type Var = CoreProp & {
	type: 'var'; // 変数
	name: string; // 変数名
};

export type StaticObj = CoreProp & {
	type: 'obj'; // 静的なオブジェクト
	value: Map<string, StaticLiteral>; // プロパティ
};

export type StaticArr = CoreProp & {
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

export type Call = CoreProp & {
	type: 'call'; // 関数呼び出し
	target: ChainTarget; // 対象
	args: Expression[]; // 引数
};

export type Index = CoreProp & {
	type: 'index'; // 配列要素アクセス
	target: ChainTarget; // 対象
	index: Expression; // インデックス
};

export type Prop = CoreProp & {
	type: 'prop'; // プロパティアクセス
	target: ChainTarget; // 対象
	name: string; // プロパティ名
};
