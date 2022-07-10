import { Node, NInfix, NCall } from '../node';
import { AiScriptError } from './error';

type OperatorInfo = {
	func: string; // 対応する関数
	prec: number; // 優先度（高いほど優先して計算される値）
};

/**
 * 中置演算子式を表す木
 * 1 + 3 ならば次のようなイメージ
 * ```
 *   (+)
 * (1) (3)
 * ```
 */
type InfixTree = {
	type: 'infixtree';
	opInfo: OperatorInfo;
	left: InfixTree | Node;
	right: InfixTree | Node;
};

function INFIX_TREE(opInfo: OperatorInfo, left: InfixTree | Node, right: InfixTree | Node): InfixTree {
	return { type: 'infixtree', opInfo, left, right };
}

/**
 * 現在の中置演算子式を表す木に新たな演算子と項を追加した木を構築する
 *
 * - 新しい演算子の優先度が現在見ている式の演算子の優先度 **以下** である場合は、現在見ている木は新しい演算子の左側の子になる。
 * 1 + 3 - 4 = (1 + 3) - 4 ならば
 * ```
 *       (-)
 *   (+)     (4)
 * (1) (3)
 * ```
 *
 * - 新しい演算子の優先度が現在見ている式の演算子の優先度より大きい場合は、右側の子と結合する。
 * 1 + 3 * 4 = 1 + (3 * 4) ならば
 * ```
 *       (+)
 *   (1)     (*)
 *         (3) (4)
 * ```
 *
 * - TODO: 左結合性の場合しか考えていない（結合性によって優先度が同じ場合の振る舞いが変わりそう）
 * - NOTE: 右結合性の演算子としては代入演算子などが挙げられる
 * - NOTE: 比較の演算子などは非結合性とされる
 */
function insert(tree: InfixTree | Node, nextOpInfo: OperatorInfo, nextTree: InfixTree | Node): InfixTree {
	if (tree.type !== 'infixtree') {
		return INFIX_TREE(nextOpInfo, tree, nextTree);
	}
	if (tree.opInfo.prec >= nextOpInfo.prec) {
		return INFIX_TREE(nextOpInfo, tree, nextTree);
	}
	const { opInfo, left, right } = tree;
	return INFIX_TREE(opInfo, left, insert(right, nextOpInfo, nextTree));
}

const opInfoTable = {
	'+': { func: 'Core:add', prec: 6 },
	'-': { func: 'Core:sub', prec: 6 },
	'*': { func: 'Core:mul', prec: 7 },
	'/': { func: 'Core:div', prec: 7 },
	'%': { func: 'Core:mod', prec: 7 },
	'==': { func: 'Core:eq', prec: 4 },
	'!=': { func: 'Core:neq', prec: 4 },
	'&&': { func: 'Core:and', prec: 3 },
	'||': { func: 'Core:or', prec: 2 },
	'<': { func: 'Core:lt', prec: 4 },
	'>': { func: 'Core:gt', prec: 4 },
	'<=': { func: 'Core:lteq', prec: 4 },
	'>=': { func: 'Core:gteq', prec: 4 },
};

function getOpInfo(operator: string): OperatorInfo {
	const op = opInfoTable[operator];
	if (op == null) {
		throw new AiScriptError(`No such operator: ${operator}.`);
	}
	return op;
}

/**
 * 中置演算子式を表す木を対応する関数呼び出しの構造体に変換する
 */
function asCall(tree: InfixTree | Node): Node {
	if (tree.type !== 'infixtree') {
		return tree;
	}
	return {
		type: 'call',
		name: tree.opInfo.func,
		args: [ asCall(tree.left), asCall(tree.right) ],
	} as NCall;
}

/**
 * NInfix を関数呼び出し形式に変換する
 */
export function infixToFnCall(node: NInfix): Node {
	const opInfos = node.operators.map(op => getOpInfo(op));
	let tree = INFIX_TREE(opInfos[0], node.operands[0], node.operands[1]);
	for (let i = 1; i < opInfos.length; i++) {
		tree = insert(tree, opInfos[i], node.operands[i + 1]);
	}
	return asCall(tree);
}
