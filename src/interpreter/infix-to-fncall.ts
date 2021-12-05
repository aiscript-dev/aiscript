import { AiScriptError } from './error';
import { Node, NInfix, NCall, Loc } from '../node';

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
type InfixTree = Node | {
	type: 'infixtree';
	opInfo: OperatorInfo;
	lchild: InfixTree;
	rchild: InfixTree;
};

function makeOperatorInfo(operator: string): OperatorInfo {
	switch (operator) {
		case '+': return { func: 'Core:add', prec: 6 };
		case '-': return { func: 'Core:sub', prec: 6 };
		case '*': return { func: 'Core:mul', prec: 7 };
		case '/': return { func: 'Core:div', prec: 7 };
		case '%': return { func: 'Core:mod', prec: 7 };
		case '==': return { func: 'Core:eq', prec: 4 };
		case '!=': return { func: 'Core:neq', prec: 4 };
		case '&&': return { func: 'Core:and', prec: 3 };
		case '||': return { func: 'Core:or', prec: 2 };
		case '<': return { func: 'Core:lt', prec: 4 };
		case '>': return { func: 'Core:gt', prec: 4 };
		case '<=': return { func: 'Core:lteq', prec: 4 };
		case '>=': return { func: 'Core:gteq', prec: 4 };
		default: throw new AiScriptError(`No such operator: ${operator}.`);
	}
}

function makeInfixTree(opInfo: OperatorInfo, lchild: InfixTree, rchild: InfixTree): InfixTree {
	return { type: 'infixtree', opInfo, lchild, rchild };
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
function insert(tree: InfixTree, nextOpInfo: OperatorInfo, nextTree: InfixTree): InfixTree {
	if (tree.type !== 'infixtree') {
		return makeInfixTree(nextOpInfo, tree, nextTree);
	} else if (tree.opInfo.prec >= nextOpInfo.prec) {
		return makeInfixTree(nextOpInfo, tree, nextTree);
	} else {
		const { opInfo, lchild, rchild } = tree;
		return makeInfixTree(opInfo, lchild, insert(rchild, nextOpInfo, nextTree));
	}
}

/**
 * 中置演算子式を表す木を対応する関数呼び出しの構造体に変換する
 */
function ascall(tree: InfixTree): Node {
	if (tree.type !== 'infixtree') {
		return tree;
	} else {
		return {
			type: 'call',
			name: tree.opInfo.func,
			args: [ ascall(tree.lchild), ascall(tree.rchild) ],
		} as NCall;
	}
}

/**
 * NInfix を関数呼び出し形式に変換する
 */
export function infixToFnCall(node: NInfix): Node {
	const infos = node.operators.map(makeOperatorInfo);
	const nodes = node.operands;

	let tree = makeInfixTree(infos[0], nodes[0], nodes[1]);

	for (let i = 1; i < infos.length; i++) {
		tree = insert(tree, infos[i], nodes[i + 1]);
	}

	return ascall(tree);
}
