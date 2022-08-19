import { TypeSource } from '../type';

export type Node = GlobalMember | NamespaceMember | LocalMember;
export type LocalMember = Statement | Expression;
export type NamespaceMember = Definition | Namespace;
export type GlobalMember = Namespace | Meta;

export type Statement =
	Definition |
	Out |
	Return |
	Attribute |
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
	Eval |
	Tmpl |
	Str |
	Num |
	Bool |
	Null |
	Obj |
	Arr |
	Var;

export type StaticLiteral =
	Str |
	Num |
	Bool |
	Null |
	StaticObj |
	StaticArr;

type CoreProp = {
	loc?: {
		start: number;
		end: number;
	};
};

export type Namespace = CoreProp & {
	type: 'ns';
	name: string;
	members: NamespaceMember[];
};

export type Meta = CoreProp & {
	type: 'meta';
	name: string | null;
	value: StaticLiteral;
};

export type Definition = CoreProp & {
	type: 'def';
	name: string;
	varType?: TypeSource;
	expr: Expression;
	mut: boolean;
};

export type Out = CoreProp & {
	type: 'out';
	expr: Expression;
};

export type Return = CoreProp & {
	type: 'return';
	expr: Expression;
};

export type Attribute = CoreProp & {
	type: 'attr';
	name: string;
	value: StaticLiteral;
};

export type Each = CoreProp & {
	type: 'forOf';
	var: string;
	items: Expression;
	for: LocalMember;
};

export type For = CoreProp & {
	type: 'for';
	var?: string;
	from?: Expression;
	to?: Expression;
	times?: Expression;
	for: LocalMember;
};

export type Loop = CoreProp & {
	type: 'loop';
	statements: LocalMember[];
};

export type Break = CoreProp & {
	type: 'break';
};

export type Continue = CoreProp & {
	type: 'continue';
};

export type AddAssign = CoreProp & {
	type: 'inc';
	dest: Expression;
	expr: Expression;
};

export type SubAssign = CoreProp & {
	type: 'dec';
	dest: Expression;
	expr: Expression;
};

export type Assign = CoreProp & {
	type: 'assign';
	dest: Expression;
	expr: Expression;
};

export type InfixOperator = "||" | "&&" | "==" | "!=" | "<=" | ">=" | "<" | ">" | "+" | "-" | "*" | "|" | "%";

export type Infix = CoreProp & {
	type: 'infix';
	operands: Expression[];
	operators: InfixOperator[];
};

export type If = CoreProp & {
	type: 'if';
	cond: Expression;
	then: LocalMember;
	elseif: {
		cond: Expression;
		then: LocalMember;
	}[];
	else?: LocalMember;
};

export type Fn = CoreProp & ChainProp & {
	type: 'fn';
	args: {
		name: string;
		type?: TypeSource;
	}[];
	ret?: TypeSource; 
	children: LocalMember[];
};

export type Match = CoreProp & ChainProp & {
	type: 'match';
	about: Expression;
	qs: {
		q: Expression;
		a: LocalMember;
	}[];
	default?: LocalMember;
};

export type Eval = CoreProp & ChainProp & {
	type: 'block';
	statements: LocalMember[];
};

export type Tmpl = CoreProp & ChainProp & {
	type: 'tmpl';
	tmpl: (string | Expression)[];
};

export type Str = CoreProp & ChainProp & {
	type: 'str';
	value: string;
};

export type Num = CoreProp & ChainProp & {
	type: 'num';
	value: number;
};

export type Bool = CoreProp & ChainProp & {
	type: 'bool';
	value: boolean;
};

export type Null = CoreProp & ChainProp & {
	type: 'null';
};

export type Obj = CoreProp & ChainProp & {
	type: 'obj';
	value: Map<string, Expression>;
};

export type Arr = CoreProp & ChainProp & {
	type: 'arr';
	value: Expression[];
};

export type Var = CoreProp & ChainProp & {
	type: 'var';
	name: string;
};

export type StaticObj = CoreProp & ChainProp & {
	type: 'obj';
	value: Map<string, StaticLiteral>;
};

export type StaticArr = CoreProp & ChainProp & {
	type: 'arr';
	value: StaticLiteral[];
};

// chain

type ChainProp = {
	chain: (CallChain | IndexChain | NameChain)[];
};

export type CallChain = CoreProp & {
	type: 'callChain';
	args: Expression[];
};

export type IndexChain = CoreProp & {
	type: 'indexChain';
	index: Expression;
};

export type NameChain = CoreProp & {
	type: 'nameChain';
	name: string;
};
