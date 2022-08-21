/**
 * ASTノード
 *
 * パーサーが生成する直接的な処理結果です。
 * パーサーが生成しやすい形式になっているため、インタプリタ等では操作しにくい構造になっていることがあります。
 * この処理結果がプラグインによって処理されるとIRノードとなります。
*/

import { TypeSource } from '../type';

export type Node = Namespace | Meta | Statement | Expression | StaticLiteral | ChainMember;

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

export type Expression =
	Infix |
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
	Var |
	Call | // IR
	Index | // IR
	Prop; // IR

export type StaticLiteral =
	Str |
	Num |
	Bool |
	Null |
	StaticObj |
	StaticArr;

// IR
export type ChainTarget =
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
	Var |
	Call | // IR
	Index | // IR
	Prop; // IR

type NodeBase = {
	__AST_NODE: never; // phantom type
	loc?: {
		start: number;
		end: number;
	};
};

export type NamespaceMember = Definition | Namespace;

export type Namespace = NodeBase & {
	type: 'ns';
	name: string;
	members: NamespaceMember[];
};

export type Meta = NodeBase & {
	type: 'meta';
	name: string | null;
	value: StaticLiteral;
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
	value: StaticLiteral;
};

export type Return = NodeBase & {
	type: 'return';
	expr: Expression;
};

export type Each = NodeBase & {
	type: 'forOf';
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
	type: 'inc';
	dest: Expression;
	expr: Expression;
};

export type SubAssign = NodeBase & {
	type: 'dec';
	dest: Expression;
	expr: Expression;
};

export type Assign = NodeBase & {
	type: 'assign';
	dest: Expression;
	expr: Expression;
};

export type InfixOperator = "||" | "&&" | "==" | "!=" | "<=" | ">=" | "<" | ">" | "+" | "-" | "*" | "|" | "%";

export type Infix = NodeBase & {
	type: 'infix';
	operands: Expression[];
	operators: InfixOperator[];
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
		type?: TypeSource;
	}[];
	ret?: TypeSource; 
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

export type Var = NodeBase & ChainProp & {
	type: 'var';
	name: string;
};

export type StaticObj = NodeBase & {
	type: 'obj';
	value: Map<string, StaticLiteral>;
};

export type StaticArr = NodeBase & {
	type: 'arr';
	value: StaticLiteral[];
};

// AST
type ChainProp = {
	chain?: ChainMember[];
};

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
	target: ChainTarget;
	args: Expression[];
};

// IR
export type Index = NodeBase & {
	type: 'index';
	target: ChainTarget;
	index: Expression;
};

// IR
export type Prop = NodeBase & {
	type: 'prop';
	target: ChainTarget;
	name: string;
};
