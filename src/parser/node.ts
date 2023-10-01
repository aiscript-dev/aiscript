/**
 * CSTノード
 *
 * パーサーが生成する直接的な処理結果です。
 * パーサーが生成しやすい形式になっているため、インタプリタ等では操作しにくい構造になっていることがあります。
 * この処理結果がプラグインによって処理されるとASTノードとなります。
*/

export type Node = Namespace | Meta | Statement | Expression | Attribute | TypeSource;

export function NODE(type: string, params: Record<string, any>): Node {
	const node: Record<string, any> = { type };
	//params.children;
	for (const key of Object.keys(params)) {
		if (params[key] !== undefined) {
			node[key] = params[key];
		}
	}
	//node.loc = { start, end };
	return node as Node;
}

export function CALL_NODE(name: string, args: Node[]): Node {
	return NODE('call', {
		target: NODE('identifier', { name }),
		args,
	});
}

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

const statementTypes = [
	'def', 'return', 'attr', 'each', 'for', 'loop', 'break', 'continue', 'assign', 'addAssign', 'subAssign',
];
export function isStatement(x: Node): x is Statement {
	return statementTypes.includes(x.type);
}

export type Expression =
	Not |
	And |
	Or |
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
	Identifier |
	Call |
	Index |
	Prop;

const expressionTypes = [
	'if', 'fn', 'match', 'block', 'exists', 'tmpl', 'str', 'num', 'bool', 'null', 'obj', 'arr', 'identifier', 'call', 'index', 'prop',
];
export function isExpression(x: Node): x is Expression {
	return expressionTypes.includes(x.type);
}

type NodeBase = {
	__AST_NODE: never; // phantom type
	loc?: {
		start: number;
		end: number;
	};
};

export type Namespace = NodeBase & {
	type: 'ns';
	name: string;
	members: (Definition | Namespace)[];
};

export type Meta = NodeBase & {
	type: 'meta';
	name: string | null;
	value: Expression;
};

export type Definition = NodeBase & {
	type: 'def';
	name: string;
	varType?: TypeSource;
	expr: Expression;
	mut: boolean;
	attr?: Attribute[];
};

export type Attribute = NodeBase & {
	type: 'attr';
	name: string;
	value: Expression;
};

export type Return = NodeBase & {
	type: 'return';
	expr: Expression;
};

export type Each = NodeBase & {
	type: 'each';
	var: string;
	items: Expression;
	for: Statement | Expression;
};

export type For = NodeBase & {
	type: 'for';
	var?: string;
	from?: Expression;
	to?: Expression;
	times?: Expression;
	for: Statement | Expression;
};

export type Loop = NodeBase & {
	type: 'loop';
	statements: (Statement | Expression)[];
};

export type Break = NodeBase & {
	type: 'break';
};

export type Continue = NodeBase & {
	type: 'continue';
};

export type AddAssign = NodeBase & {
	type: 'addAssign';
	dest: Expression;
	expr: Expression;
};

export type SubAssign = NodeBase & {
	type: 'subAssign';
	dest: Expression;
	expr: Expression;
};

export type Assign = NodeBase & {
	type: 'assign';
	dest: Expression;
	expr: Expression;
};

export type Not = NodeBase & {
	type: 'not';
	expr: Expression;
};

export type And = NodeBase & {
	type: 'and';
	left: Expression;
	right: Expression;
}

export type Or = NodeBase & {
	type: 'or';
	left: Expression;
	right: Expression;
}

export type If = NodeBase & {
	type: 'if';
	cond: Expression;
	then: Statement | Expression;
	elseif: {
		cond: Expression;
		then: Statement | Expression;
	}[];
	else?: Statement | Expression;
};

export type Fn = NodeBase & {
	type: 'fn';
	args: {
		name: string;
		argType?: TypeSource;
	}[];
	retType?: TypeSource;
	children: (Statement | Expression)[];
};

export type Match = NodeBase & {
	type: 'match';
	about: Expression;
	qs: {
		q: Expression;
		a: Statement | Expression;
	}[];
	default?: Statement | Expression;
};

export type Block = NodeBase & {
	type: 'block';
	statements: (Statement | Expression)[];
};

export type Exists = NodeBase & {
	type: 'exists';
	identifier: Identifier;
};

export type Tmpl = NodeBase & {
	type: 'tmpl';
	tmpl: (string | Expression)[];
};

export type Str = NodeBase & {
	type: 'str';
	value: string;
};

export type Num = NodeBase & {
	type: 'num';
	value: number;
};

export type Bool = NodeBase & {
	type: 'bool';
	value: boolean;
};

export type Null = NodeBase & {
	type: 'null';
};

export type Obj = NodeBase & {
	type: 'obj';
	value: Map<string, Expression>;
};

export type Arr = NodeBase & {
	type: 'arr';
	value: Expression[];
};

export type Identifier = NodeBase & {
	type: 'identifier';
	name: string;
};

export type Call = NodeBase & {
	type: 'call';
	target: Expression;
	args: Expression[];
};

export type Index = NodeBase & {
	type: 'index';
	target: Expression;
	index: Expression;
};

export type Prop = NodeBase & {
	type: 'prop';
	target: Expression;
	name: string;
};

// Type source

export type TypeSource = NamedTypeSource | FnTypeSource;

export type NamedTypeSource = NodeBase & {
	type: 'namedTypeSource';
	name: string;
	inner?: TypeSource;
};

export type FnTypeSource = NodeBase & {
	type: 'fnTypeSource';
	args: TypeSource[];
	result: TypeSource;
};
