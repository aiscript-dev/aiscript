import * as N from '../node';
import { AiScriptError } from './error';

/**
 * 中置演算子式を表す木
 * 1 + 3 ならば次のようなイメージ
 * ```
 *   (+)
 * (1) (3)
 * ```
 */
type InfixTree = {
	type: 'infixTree';
	left: InfixTree | N.Node;
	right: InfixTree | N.Node;
	info: {
		func: string; // 対応する関数名
		priority: number; // 優先度（高いほど優先して計算される値）
	};
};

function INFIX_TREE(left: InfixTree | N.Node, right: InfixTree | N.Node, info: InfixTree["info"]): InfixTree {
	return { type: 'infixTree', left, right, info };
}

/**
 * 現在の中置演算子式を表す木に新たな演算子と項を追加した木を構築する
 *
 * - 新しい演算子の優先度が現在見ている木の演算子の優先度 **以下** である場合は、現在見ている木は新しい演算子の左側の子になる。
 * 1 + 3 - 4 = (1 + 3) - 4 ならば
 * ```
 *       (-)
 *   (+)     (4)
 * (1) (3)
 * ```
 *
 * - 新しい演算子の優先度が現在見ている木の演算子の優先度 **より大きい** 場合は、右側の子と結合する。
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
function insertTree(currTree: InfixTree | N.Node, nextTree: InfixTree | N.Node, nextOpInfo: InfixTree["info"]): InfixTree {
	if (currTree.type !== 'infixTree') {
		return INFIX_TREE(currTree, nextTree, nextOpInfo);
	}

	if (nextOpInfo.priority <= currTree.info.priority) {
		return INFIX_TREE(currTree, nextTree, nextOpInfo);
	} else {
		const { left, right, info: currInfo } = currTree;
		return INFIX_TREE(left, insertTree(right, nextTree, nextOpInfo), currInfo);
	}
}

/**
 * 中置演算子式を表す木を対応する関数呼び出しの構造体に変換する
 */
function treeToNode(tree: InfixTree | N.Node): N.Node {
	if (tree.type !== 'infixTree') {
		return tree;
	}
	return {
		type: 'call',
		target: { type: 'var', name: tree.info.func },
		args: [treeToNode(tree.left), treeToNode(tree.right)],
	} as N.Call;
}

const infoTable: Record<string, InfixTree["info"]> = {
	'*': { func: 'Core:mul', priority: 7 },
	'/': { func: 'Core:div', priority: 7 },
	'%': { func: 'Core:mod', priority: 7 },
	'+': { func: 'Core:add', priority: 6 },
	'-': { func: 'Core:sub', priority: 6 },
	'==': { func: 'Core:eq', priority: 4 },
	'!=': { func: 'Core:neq', priority: 4 },
	'<': { func: 'Core:lt', priority: 4 },
	'>': { func: 'Core:gt', priority: 4 },
	'<=': { func: 'Core:lteq', priority: 4 },
	'>=': { func: 'Core:gteq', priority: 4 },
	'&&': { func: 'Core:and', priority: 3 },
	'||': { func: 'Core:or', priority: 2 },
};

/**
 * NInfix を関数呼び出し形式に変換する
 */
export function infixToFnCall(node: N.Infix): N.Node {
	const infos = node.operators.map(op => {
		const info = infoTable[op];
		if (info == null) {
			throw new AiScriptError(`No such operator: ${op}.`);
		}
		return info;
	});
	let currTree = INFIX_TREE(node.operands[0], node.operands[1], infos[0]);
	for (let i = 0; i < infos.length - 1; i++) {
		currTree = insertTree(currTree, node.operands[2 + i], infos[1 + i]);
	}
	return treeToNode(currTree);
}
