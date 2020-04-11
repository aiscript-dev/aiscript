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
	type: 'for'; // for文
	var: string; // イテレータ変数名
	from: Node; // 開始値
	to: Node; // 終値
	s: Node[]; // 本体処理
} | {
	type: 'var'; // 変数
	name: string; // 変数名
} | {
	type: 'null'; // nullリテラル
	value: null; // null
} | {
	type: 'bool'; // 真理値リテラル
	value: boolean; // 真理値
} | {
	type: 'num'; // 数値リテラル
	value: number; // 数値
} | {
	type: 'str'; // 文字列リテラル
	value: string; // 文字列
} | {
	type: 'arr'; // 配列リテラル
	value: Node[]; // アイテム
} | {
	type: 'fn'; // 関数リテラル
	args: string[]; // 引数名
	children: Node[]; // 関数の本体処理
} | {
	type: 'obj'; // オブジェクトリテラル
	value: Record<string, Node>; // オブジェクト
} | {
	type: 'prop'; // プロパティアクセス
	obj: string; // オブジェクト変数名
	path: string[]; // プロパティパス
} | {
	type: 'index'; // 配列要素アクセス
	arr: string; // 配列変数名
	i: Node; // インデックス
} | {
	type: 'block'; // ブロック
	statements: Node[]; // 処理
};
