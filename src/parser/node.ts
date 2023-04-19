/**
 * CSTノード
 *
 * パーサーが生成する直接的な処理結果です。
 * パーサーが生成しやすい形式になっているため、インタプリタ等では操作しにくい構造になっていることがあります。
 * この処理結果がプラグインによって処理されるとASTノードとなります。
*/

export type Node = Namespace | Meta | Statement | Expression | ChainMember | TypeSource;

export type Statement =
	Definition |
	Return |
	Attribute | // AST
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
	Infix |
	Not |
	If |
	Fn |
	Match |
	Block |
	Tmpl |
	Str |
	Num |
	Bool |
	Null |
	Obj |
	Arr |
	Identifier |
	Call | // IR
	Index | // IR
	Prop; // IR

const expressionTypes = [
	'infix', 'if', 'fn', 'match', 'block', 'tmpl', 'str', 'num', 'bool', 'null', 'obj', 'arr', 'identifier', 'call', 'index', 'prop',
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
	attr?: Attribute[]; // IR
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

export type InfixOperator = '||' | '&&' | '==' | '!=' | '<=' | '>=' | '<' | '>' | '+' | '-' | '*' | '^' | '/' | '%';

export type Infix = NodeBase & {
	type: 'infix';
	operands: Expression[];
	operators: InfixOperator[];
};

export type Not = NodeBase & {
	type: 'not';
	expr: Expression;
};

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

export type Fn = NodeBase & ChainProp & {
	type: 'fn';
	args: {
		name: string;
		argType?: TypeSource;
	}[];
	retType?: TypeSource;
	children: (Statement | Expression)[];
};

export type Match = NodeBase & ChainProp & {
	type: 'match';
	about: Expression;
	qs: {
		q: Expression;
		a: Statement | Expression;
	}[];
	default?: Statement | Expression;
};

export type Block = NodeBase & ChainProp & {
	type: 'block';
	statements: (Statement | Expression)[];
};

export type Tmpl = NodeBase & ChainProp & {
	type: 'tmpl';
	tmpl: (string | Expression)[];
};

export type Str = NodeBase & ChainProp & {
	type: 'str';
	value: string;
};

export type Num = NodeBase & ChainProp & {
	type: 'num';
	value: number;
};

export type Bool = NodeBase & ChainProp & {
	type: 'bool';
	value: boolean;
};

export type Null = NodeBase & ChainProp & {
	type: 'null';
};

export type Obj = NodeBase & ChainProp & {
	type: 'obj';
	value: Map<string, Expression>;
};

export type Arr = NodeBase & ChainProp & {
	type: 'arr';
	value: Expression[];
};

export type Identifier = NodeBase & ChainProp & {
	type: 'identifier';
	name: string;
};

// AST
type ChainProp = {
	chain?: ChainMember[];
};

// AST
export function hasChainProp<T extends Node>(x: T): x is T & ChainProp {
	return x instanceof Object && 'chain' in x;
}

// AST
export type ChainMember = CallChain | IndexChain | PropChain;

// AST
export type CallChain = NodeBase & {
	type: 'callChain';
	args: Expression[];
};

// AST
export type IndexChain = NodeBase & {
	type: 'indexChain';
	index: Expression;
};

// AST
export type PropChain = NodeBase & {
	type: 'propChain';
	name: string;
};

// IR
export type Call = NodeBase & {
	type: 'call';
	target: Expression;
	args: Expression[];
};
export function CALL(target: Call['target'], args: Call['args'], loc?: { start: number, end: number }): Call {
	return { type: 'call', target, args, loc } as Call;
}

// IR
export type Index = NodeBase & {
	type: 'index';
	target: Expression;
	index: Expression;
};

export function INDEX(target: Index['target'], index: Index['index'], loc?: { start: number, end: number }): Index {
	return { type: 'index', target, index, loc } as Index;
}

// IR
export type Prop = NodeBase & {
	type: 'prop';
	target: Expression;
	name: string;
};

export function PROP(target: Prop['target'], name: Prop['name'], loc?: { start: number, end: number }): Prop {
	return { type: 'prop', target, name, loc } as Prop;
}

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
