/**
 * ASTノード
*/

export type Loc = {
	line: number;
	column: number;
};

export type Node = Namespace | Meta | Statement | Expression | TypeSource | Attribute;

export class Namespace {
	type = 'ns' as const; // 名前空間
	constructor(
		public name: string, // 空間名
		public members: (Definition | Namespace)[], // メンバー
		public loc: Loc, // コード位置
	) { }
}

export class Meta {
	type = 'meta' as const; // メタデータ定義
	constructor(
		public name: string | null, // 名
		public value: Expression, // 値
		public loc: Loc, // コード位置
	) { }
}

// statement

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
	SubAssign |
	Expression;

const statementTypes = [
	'def', 'return', 'each', 'for', 'loop', 'break', 'continue', 'assign', 'addAssign', 'subAssign',
];
export function isStatement(x: Node): x is Statement {
	return statementTypes.includes(x.type);
}

export class Definition {
	type = 'def' as const; // 変数宣言文
	constructor(
		public name: string, // 変数名
		public varType: TypeSource | null, // 変数の型
		public expr: Expression, // 式
		public mut: boolean, // ミュータブルか否か
		public attr: Attribute[], // 付加された属性
		public loc: Loc, // コード位置
	) { }
}

export class Attribute {
	type = 'attr' as const; // 属性
	constructor(
		public name: string, // 属性名
		public value: Expression, // 値
		public loc: Loc, // コード位置
	) { }
}

export class Return {
	type = 'return' as const; // return文
	constructor(
		public expr: Expression, // 式
		public loc: Loc, // コード位置
	) { }
}

export class Each {
	type = 'each' as const; // each文
	constructor(
		public _var: string, // イテレータ変数名
		public items: Expression, // 配列
		public _for: Statement | Expression, // 本体処理
		public loc: Loc, // コード位置
	) { }
}

export class For {
	type = 'for' as const; // for文
	constructor(
		public _var: string | null, // イテレータ変数名
		public from: Expression | null, // 開始値
		public to: Expression | null, // 終値
		public times: Expression | null, // 回数
		public _for: Statement | Expression, // 本体処理
		public loc: Loc, // コード位置
	) { }
}

export class Loop {
	type = 'loop' as const; // loop文
	constructor(
		public statements: (Statement | Expression)[], // 処理
		public loc: Loc, // コード位置
	) { }
}

export class Break {
	type = 'break' as const; // break文
	constructor(
		public loc: Loc, // コード位置
	) { }
}

export class Continue {
	type = 'continue' as const; // continue文
	constructor(
		public loc: Loc, // コード位置
	) { }
}

export class AddAssign {
	type = 'addAssign' as const; // 加算代入文
	constructor(
		public dest: Expression, // 代入先
		public expr: Expression, // 式
		public loc: Loc, // コード位置
	) { }
}

export class SubAssign {
	type = 'subAssign' as const; // 減算代入文
	constructor(
		public dest: Expression, // 代入先
		public expr: Expression, // 式
		public loc: Loc, // コード位置
	) { }
}

export class Assign {
	type = 'assign' as const; // 代入文
	constructor(
		public dest: Expression, // 代入先
		public expr: Expression, // 式
		public loc: Loc, // コード位置
	) { }
}

// expressions

export type Expression =
	If |
	Fn |
	Match |
	Block |
	Exists |
	Tmpl |
	Str |
	Num |
	Bool |
	Null |
	Obj |
	Arr |
	Not |
	And |
	Or |
	Identifier |
	Call |
	Index |
	Prop;

const expressionTypes = [
	'if', 'fn', 'match', 'block', 'exists', 'tmpl', 'str', 'num', 'bool', 'null', 'obj', 'arr', 'not', 'and', 'or', 'identifier', 'call', 'index', 'prop',
];
export function isExpression(x: Node): x is Expression {
	return expressionTypes.includes(x.type);
}

export class Not {
	type = 'not' as const; // 否定
	constructor(
		public expr: Expression, // 式
		public loc: Loc, // コード位置
	) { }
}

export class And {
	type = 'and' as const; // 否定
	constructor(
		public left: Expression,
		public right: Expression,
		public loc: Loc, // コード位置
	) { }
}

export class Or {
	type = 'or' as const; // 否定
	constructor(
		public left: Expression,
		public right: Expression,
		public loc: Loc, // コード位置
	) { }
}

export class If {
	type = 'if' as const; // if式
	constructor(
		public cond: Expression, // 条件式
		public then: Statement | Expression, // then節
		public elseif: {
			cond: Expression, // elifの条件式
			then: Statement,// elif節
		}[],
		public _else: Statement | Expression | null, // else節
		public loc: Loc, // コード位置
	) { }
}

export class Fn {
	type = 'fn' as const; // 関数
	constructor(
		public args: {
			name: string, // 引数名
			argType: TypeSource | null, // 引数の型
		}[],
		public retType: TypeSource | null, // 戻り値の型
		public children: (Statement | Expression)[], // 本体処理
		public loc: Loc, // コード位置
	) { }
}

export class Match {
	type = 'match' as const; // パターンマッチ
	constructor(
		public about: Expression, // 対象
		public qs: {
			q: Expression; // 条件
			a: Statement | Expression; // 結果
		}[],
		public _default: Statement | Expression | null, // デフォルト値
		public loc: Loc, // コード位置
	) { }
}

export class Block {
	type = 'block' as const; // ブロックまたはeval式
	constructor(
		public statements: (Statement | Expression)[], // 処理
		public loc: Loc, // コード位置
	) { }
}

export class Exists {
	type = 'exists' as const; // 変数の存在判定
	constructor(
		public identifier: Identifier, // 変数名
		public loc: Loc, // コード位置
	) { }
}

export class Tmpl {
	type = 'tmpl' as const; // テンプレート
	constructor(
		public tmpl: (string | Expression)[], // 処理
		public loc: Loc, // コード位置
	) { }
}

export class Str {
	type = 'str' as const; // テンプレート
	constructor(
		public value: string, // 文字列
		public loc: Loc, // コード位置
	) { }
}

export class Num {
	type = 'num' as const; // 数値リテラル
	constructor(
		public value: number, // 数値
		public loc: Loc, // コード位置
	) { }
}

export class Bool {
	type = 'bool' as const; // 真理値リテラル
	constructor(
		public value: boolean, // 真理値
		public loc: Loc, // コード位置
	) { }
}

export class Null {
	type = 'null' as const; // nullリテラル
	constructor(
		public loc: Loc, // コード位置
	) { }
}

export class Obj {
	type = 'obj' as const; // オブジェクト
	constructor(
		public value: Map<string, Expression>, // プロパティ
		public loc: Loc, // コード位置
	) { }
}

export class Arr {
	type = 'arr' as const; // 配列
	constructor(
		public value: Expression[], // アイテム
		public loc: Loc, // コード位置
	) { }
}

export class Identifier {
	type = 'identifier' as const; // 変数などの識別子
	constructor(
		public name: string, // 変数名
		public loc: Loc, // コード位置
	) { }
}

export class Call {
	type = 'call' as const; // 関数呼び出し
	constructor(
		public target: Expression, // 対象
		public args: Expression[], // 引数
		public loc: Loc, // コード位置
	) { }
}

export class Index {
	type = 'index' as const; // 配列要素アクセス
	constructor(
		public target: Expression, // 対象
		public index: Expression, // インデックス
		public loc: Loc, // コード位置
	) { }
}

export class Prop {
	type = 'prop' as const; // プロパティアクセス
	constructor(
		public target: Expression, // 対象
		public name: string, // プロパティ名
		public loc: Loc, // コード位置
	) { }
}

// Type source

export type TypeSource = NamedTypeSource | FnTypeSource;

export class NamedTypeSource {
	type = 'namedTypeSource' as const; // 名前付き型
	constructor(
		public name: string, // 型名
		public inner: TypeSource | null, // 内側の型
		public loc: Loc, // コード位置
	) { }
}

export class FnTypeSource {
	type = 'fnTypeSource' as const; // 関数の型
	constructor(
		public args: TypeSource[], // 引数の型
		public result: TypeSource, // 戻り値の型
		public loc: Loc, // コード位置
	) { }
}
