import { TypeSource } from './type';

export type Loc = {
	start: number;
	end: number;
};

export type NDef = {
	type: 'def'; // 変数宣言
	loc?: Loc; // コード位置
	name: string; // 変数名
	varType?: TypeSource; // 変数の型
	expr: Node; // 式
	mut: boolean; // ミュータブルか否か
	attr: NAttr[]; // 付加された属性
};

export type NAssign = {
	type: 'assign'; // 再代入
	loc?: Loc; // コード位置
	name: string; // 変数名
	expr: Node; // 式
};

export type NPropAssign = {
	type: 'propAssign'; // プロパティ再代入
	loc?: Loc; // コード位置
	obj: string; // オブジェクト変数名
	path: string[]; // プロパティパス
	expr: Node; // 式
};

export type NIndexAssign = {
	type: 'indexAssign'; // 配列要素再代入
	loc?: Loc; // コード位置
	arr: string; // 配列変数名
	i: Node; // インデックス
	expr: Node; // 式
};

export type NInc = {
	type: 'inc'; // インクリメント
	loc?: Loc; // コード位置
	name: string; // 変数名
	expr: Node; // 式
};

export type NDec = {
	type: 'dec'; // デクリメント
	loc?: Loc; // コード位置
	name: string; // 変数名
	expr: Node; // 式
};

export type NCall = {
	type: 'call'; // 関数呼び出し
	loc?: Loc; // コード位置
	name: string; // 関数名
	args: Node[]; // 引数(式の配列)
};

export type NReturn = {
	type: 'return'; // return
	loc?: Loc; // コード位置
	expr: Node; // 式
};

export type NBreak = {
	type: 'break'; // break
	loc?: Loc; // コード位置
};

export type NContinue = {
	type: 'continue'; // continue
	loc?: Loc; // コード位置
};

export type NIf = {
	type: 'if'; // if文
	loc?: Loc; // コード位置
	cond: Node; // 条件式
	then: Node; // then節
	elseif: {
		cond: Node;
		then: Node;
	}[]; // elseif節
	else?: Node; // else節
};

export type NLoop = {
	type: 'loop'; // loop文
	loc?: Loc; // コード位置
	statements: Node[]; // 処理
};

export type NFor = {
	type: 'for'; // for文
	loc?: Loc; // コード位置
	var?: string; // イテレータ変数名
	from?: Node; // 開始値
	to?: Node; // 終値
	times?: Node; // 回数
	for: Node; // 本体処理
};

export type NForOf = {
	type: 'forOf'; // for of文
	loc?: Loc; // コード位置
	var: string; // イテレータ変数名
	items: Node; // 配列
	for: Node; // 本体処理
};

export type NVar = {
	type: 'var'; // 変数
	loc?: Loc; // コード位置
	name: string; // 変数名
};

export type NNull = {
	type: 'null'; // nullリテラル
	loc?: Loc; // コード位置
};

export type NBool = {
	type: 'bool'; // 真理値リテラル
	loc?: Loc; // コード位置
	value: boolean; // 真理値
};

export type NNum = {
	type: 'num'; // 数値リテラル
	loc?: Loc; // コード位置
	value: number; // 数値
};

export type NStr = {
	type: 'str'; // 文字列リテラル
	loc?: Loc; // コード位置
	value: string; // 文字列
};

export type NArr = {
	type: 'arr'; // 配列リテラル
	loc?: Loc; // コード位置
	value: Node[]; // アイテム
};

export type NFn = {
	type: 'fn'; // 関数リテラル
	loc?: Loc; // コード位置
	args: {
		name: string; // 引数名
		type?: TypeSource; // 引数の型
	}[];
	ret?: TypeSource; // 戻り値の型
	children: Node[]; // 関数の本体処理
};

export type NObj = {
	type: 'obj'; // オブジェクトリテラル
	loc?: Loc; // コード位置
	value: Map<string, Node>; // オブジェクト
};

export type NProp = {
	type: 'prop'; // プロパティアクセス
	loc?: Loc; // コード位置
	obj: string; // オブジェクト変数名
	path: string[]; // プロパティパス
};

export type NPropCall = {
	type: 'propCall'; // プロパティアクセス(関数呼び出し)
	loc?: Loc; // コード位置
	obj: string; // オブジェクト変数名
	path: string[]; // プロパティパス
	args: Node[]; // 引数(式の配列)
};

export type NIndex = {
	type: 'index'; // 配列要素アクセス
	loc?: Loc; // コード位置
	arr: string; // 配列変数名
	i: Node; // インデックス
};

export type NBlock = {
	type: 'block'; // ブロック
	loc?: Loc; // コード位置
	statements: Node[]; // 処理
};

export type NTmpl = {
	type: 'tmpl'; // テンプレート
	loc?: Loc; // コード位置
	tmpl: (string | Node)[]; // 処理
};

export type NNs = {
	type: 'ns'; // 名前空間
	loc?: Loc; // コード位置
	name: string; // 空間名
	members: Node[]; // メンバー
};

export type NMatch = {
	type: 'match'; // パターンマッチ
	loc?: Loc; // コード位置
	about: Node; // 対象
	qs: {
		q: Node; // 条件
		a: Node; // 結果
	}[];
	default?: Node; // デフォルト値
};

export type NLangVer = {
	type: 'langVer'; // 言語バージョン指定
	loc?: Loc; // コード位置
	name: string; // バージョン名
};

export type NMeta = {
	type: 'meta'; // メタデータ定義
	loc?: Loc; // コード位置
	name: string | null; // 名
	value: Node; // 値
};

export type NAttr = {
	type: 'attr'; // 属性
	loc?: Loc; // コード位置
	name: string; // 属性名
	value: Node; // 値
};

export type NInfix = {
	type: 'infix'; // 中置演算子式
	loc?: Loc; // コード位置
	operands: Node[]; // 項
	operators: NOperator[]; // 演算子
};

export type NOperator = {
	type: 'operator'; // 中置演算子
	loc?: Loc; // コード位置
	op: string; // 実際の記号列
}

// TODO: analyze前のNodeとanalyze後のNodeが区別されておらず気持ち悪いのをなんとかしたい
export type Node =
	NDef |
	NAssign |
	NPropAssign |
	NIndexAssign |
	NInc |
	NDec |
	NCall |
	NReturn |
	NBreak |
	NContinue |
	NIf |
	NLoop |
	NFor |
	NForOf |
	NVar |
	NNull |
	NBool |
	NNum |
	NStr |
	NArr |
	NFn |
	NObj |
	NProp |
	NPropCall |
	NIndex |
	NBlock |
	NTmpl |
	NMatch |
	NNs |
	NLangVer |
	NMeta |
	NAttr |
	NInfix |
	NOperator;
