/**
 * IRノード
 * 
 * 詳しくはASTノードの説明を参照してください。
*/

import { TypeSource } from '../type';

export type Node = GlobalMember | StaticLiteral;
export type GlobalMember = Namespace | Meta | LocalMember;
export type NamespaceMember = Definition | Namespace;
export type LocalMember = Statement | Expression;

export type Statement =
	Definition |
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
	Var |
	Call |
	Index |
	Prop;

export type StaticLiteral =
	Str |
	Num |
	Bool |
	Null |
	StaticObj |
	StaticArr;

export type ChainSource =
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
	Var |
	Call |
	Index |
	Prop;

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
	attr: Attribute[];
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

// TODO: remove by transform plugin
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

export type Fn = CoreProp & {
	type: 'fn';
	args: {
		name: string;
		type?: TypeSource;
	}[];
	ret?: TypeSource; 
	children: LocalMember[];
};

export type Match = CoreProp & {
	type: 'match';
	about: Expression;
	qs: {
		q: Expression;
		a: LocalMember;
	}[];
	default?: LocalMember;
};

export type Eval = CoreProp & {
	type: 'block';
	statements: LocalMember[];
};

export type Tmpl = CoreProp & {
	type: 'tmpl';
	tmpl: (string | Expression)[];
};

export type Str = CoreProp & {
	type: 'str';
	value: string;
};

export type Num = CoreProp & {
	type: 'num';
	value: number;
};

export type Bool = CoreProp & {
	type: 'bool';
	value: boolean;
};

export type Null = CoreProp & {
	type: 'null';
};

export type Obj = CoreProp & {
	type: 'obj';
	value: Map<string, Expression>;
};

export type Arr = CoreProp & {
	type: 'arr';
	value: Expression[];
};

export type Var = CoreProp & {
	type: 'var';
	name: string;
};

export type StaticObj = CoreProp & {
	type: 'obj';
	value: Map<string, StaticLiteral>;
};

export type StaticArr = CoreProp & {
	type: 'arr';
	value: StaticLiteral[];
};

// [ex.] call > var
// [ex.] call > fn
export type Call = CoreProp & {
	type: 'call';
	expr: ChainSource;
	args: Expression[];
};

// [ex.] index > var
// [ex.] index > arr
export type Index = CoreProp & {
	type: 'index';
	expr: ChainSource;
	index: Expression;
};

// [ex.] prop > var
// [ex.] prop > obj
export type Prop = CoreProp & {
	type: 'prop';
	expr: ChainSource;
	name: string;
};
