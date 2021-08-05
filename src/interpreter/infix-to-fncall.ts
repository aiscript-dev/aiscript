import { AiScriptError } from './error';
import { Node, NInfix, NOperator, NCall, Loc } from '../node';

type OperatorInfo = {
	fn: string;
	loc?: Loc;
	prec: number;
};

type Tree = Node | {
	type: 'tree';
	o: OperatorInfo;
	l: Tree;
	r: Tree;
};

function Tree(operator: OperatorInfo, ltree: Tree, rtree: Tree): Tree {
	return { o: operator, l: ltree, r: rtree, type: 'tree' };
}

function insert(op: OperatorInfo, n: Tree, t: Tree): Tree {
	if (t.type !== 'tree') {
		return Tree(op, t, n);
	} else if (t.o.prec >= op.prec) {
		return Tree(op, t, n);
	} else {
		const { o, l, r } = t;
		return Tree(o, l, insert(op, n, r));
	}
}

function ascall(t: Tree): Node {
	if (t.type !== 'tree') {
		return t;
	} else {
		return {
			type: 'call',
			loc: t.o.loc,
			name: t.o.fn,
			args: [ ascall(t.l), ascall(t.r) ],
		} as NCall;
	}
}

function operatorInfo(operator: NOperator): OperatorInfo {
	switch (operator.op) {
		case '+': return { fn: 'Core:add', prec: 6, loc: operator.loc };
		case '-': return { fn: 'Core:sub', prec: 6, loc: operator.loc };
		case '*': return { fn: 'Core:mul', prec: 7, loc: operator.loc };
		case '/': return { fn: 'Core:div', prec: 7, loc: operator.loc };
		case '%': return { fn: 'Core:mod', prec: 7, loc: operator.loc };
		case '=': return { fn: 'Core:eq', prec: 4, loc: operator.loc };
		case '!=': return { fn: 'Core:neq', prec: 4, loc: operator.loc };
		case '&': return { fn: 'Core:and', prec: 3, loc: operator.loc };
		case '|': return { fn: 'Core:or', prec: 2, loc: operator.loc };
		case '<': return { fn: 'Core:lt', prec: 4, loc: operator.loc };
		case '>': return { fn: 'Core:gt', prec: 4, loc: operator.loc };
		case '<=': return { fn: 'Core:lteq', prec: 4, loc: operator.loc };
		case '>=': return { fn: 'Core:gteq', prec: 4, loc: operator.loc };
		default: throw new AiScriptError(`No such operator: ${operator.op}.`);
	}
}

export function infixToFnCall(node: NInfix): Node {
	const infos = node.operators.map(operatorInfo);
	const nodes = node.operands;

	let tree = Tree(infos[0], nodes[0], nodes[1]);

	for (let i = 2; i < nodes.length; i++) {
		tree = insert(infos[i - 1], nodes[i], tree);
	}

	return ascall(tree);
}
