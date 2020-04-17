export type NDef = {
	type: 'def'; // 変数宣言
	name: string; // 変数名
	expr: Node; // 式
	mut: boolean; // ミュータブルか否か
};

export type NAssign = {
	type: 'assign'; // 再代入
	name: string; // 変数名
	expr: Node; // 式
};

export type NCall = {
	type: 'call'; // 関数呼び出し
	name: string; // 関数名
	args: Node[]; // 引数(式の配列)
};

export type NReturn = {
	type: 'return'; // return
	expr: Node; // 式
};

export type NIf = {
	type: 'if'; // if文
	cond: Node; // 条件式
	then: Node[]; // if文のthen節
	elseif: {
		cond: Node;
		then: Node[];
	}[]; // if文のelseif節
	else: Node[]; // if文のelse節
};

export type NFor = {
	type: 'for'; // for文
	var?: string; // イテレータ変数名
	from?: Node; // 開始値
	to?: Node; // 終値
	times?: Node; // 回数
	s: Node[]; // 本体処理
};

export type NForOf = {
	type: 'forOf'; // for of文
	var: string; // イテレータ変数名
	items: Node; // 配列
	s: Node[]; // 本体処理
};

export type NVar = {
	type: 'var'; // 変数
	name: string; // 変数名
};

export type NNull = {
	type: 'null'; // nullリテラル
};

export type NBool = {
	type: 'bool'; // 真理値リテラル
	value: boolean; // 真理値
};

export type NNum = {
	type: 'num'; // 数値リテラル
	value: number; // 数値
};

export type NStr = {
	type: 'str'; // 文字列リテラル
	value: string; // 文字列
};

export type NArr = {
	type: 'arr'; // 配列リテラル
	value: Node[]; // アイテム
};

export type NFn = {
	type: 'fn'; // 関数リテラル
	args: string[]; // 引数名
	children: Node[]; // 関数の本体処理
};

export type NObj = {
	type: 'obj'; // オブジェクトリテラル
	value: Map<string, Node>; // オブジェクト
};

export type NProp = {
	type: 'prop'; // プロパティアクセス
	obj: string; // オブジェクト変数名
	path: string[]; // プロパティパス
};

export type NPropCall = {
	type: 'propCall'; // プロパティアクセス(関数呼び出し)
	obj: string; // オブジェクト変数名
	path: string[]; // プロパティパス
	args: Node[]; // 引数(式の配列)
};

export type NIndex = {
	type: 'index'; // 配列要素アクセス
	arr: string; // 配列変数名
	i: Node; // インデックス
};

export type NBlock = {
	type: 'block'; // ブロック
	statements: Node[]; // 処理
};

export type NTmpl = {
	type: 'tmpl'; // テンプレート
	tmpl: (string | Node)[]; // 処理
};

export type NNs = {
	type: 'ns'; // 名前空間
	name: string; // 空間名
	members: Node[]; // メンバー
};

export type Node = NDef | NAssign | NCall | NReturn | NIf | NFor | NForOf | NVar | NNull | NBool | NNum | NStr | NArr | NFn | NObj | NProp | NPropCall | NIndex | NBlock | NTmpl | NNs;
