import { Node, NDef, NAssign, NCall, NReturn, NIf, NFor, NForOf, NVar, NNull, NBool, NNum, NStr, NArr, NFn, NObj, NProp, NPropCall, NIndex, NBlock, NTmpl, NNs, NMatch, NMeta, NPropAssign, NIndexAssign, NInc, NDec, NAttr, NBreak, NLoop, NContinue, NInfix, NOperator } from './node';

const types = {
	def: 0,
	assign: 1,
	call: 2,
	return: 3,
	if: 4,
	for: 5,
	forOf: 6,
	var: 7,
	null: 8,
	bool: 9,
	num: 10,
	str: 11,
	arr: 12,
	fn: 13,
	obj: 14,
	prop: 15,
	propCall: 16,
	index: 17,
	block: 18,
	tmpl: 19,
	ns: 20,
	match: 21,
	meta: 22,
	propAssign: 23,
	indexAssign: 24,
	inc: 25,
	dec: 26,
	attr: 27,
	break: 28,
	loop: 29,
	continue: 30,
	infix: 31,
	operator: 32,
};

type Bin = any[];

export function serializeOne(node: Node | null | undefined): Bin | null {
	if (node == null) return null;
	switch (node.type) {
		case 'def': return [types[node.type], node.name, node.mut, serializeOne(node.expr), serialize(node.attr)];
		case 'assign': return [types[node.type], node.name, serializeOne(node.expr)];
		case 'call': return [types[node.type], node.name, serialize(node.args)];
		case 'return': return [types[node.type], serializeOne(node.expr)];
		case 'if': return [types[node.type], serializeOne(node.cond), serializeOne(node.then), node.elseif.map(x => [serializeOne(x.cond), serializeOne(x.then)]), serializeOne(node.else)];
		case 'for': return [types[node.type], node.var, serializeOne(node.from), serializeOne(node.to), serializeOne(node.times), serializeOne(node.for)];
		case 'forOf': return [types[node.type], node.var, serializeOne(node.items), serializeOne(node.for)];
		case 'var': return [types[node.type], node.name];
		case 'null': return [types[node.type]];
		case 'bool': return [types[node.type], node.value];
		case 'num': return [types[node.type], node.value];
		case 'str': return [types[node.type], node.value];
		case 'arr': return [types[node.type], serialize(node.value)];
		case 'fn': return [types[node.type], node.args, serialize(node.children)];
		case 'obj': return [types[node.type], Array.from(node.value.entries()).map(x => [x[0], serializeOne(x[1])])];
		case 'prop': return [types[node.type], node.obj, node.path];
		case 'propCall': return [types[node.type], node.obj, node.path, serialize(node.args)];
		case 'index': return [types[node.type], node.arr, serializeOne(node.i)];
		case 'block': return [types[node.type], serialize(node.statements)];
		case 'tmpl': return [types[node.type], node.tmpl.map(x => typeof x === 'string' ? x : serializeOne(x))];
		case 'ns': return [types[node.type], node.name, serialize(node.members)];
		case 'match': return [types[node.type], serializeOne(node.about), node.qs.map(x => [serializeOne(x.q), serializeOne(x.a)]), serializeOne(node.default)];
		case 'meta': return [types[node.type], node.name, serializeOne(node.value)];
		case 'propAssign': return [types[node.type], node.obj, node.path, serializeOne(node.expr)];
		case 'indexAssign': return [types[node.type], node.arr, serializeOne(node.i), serializeOne(node.expr)];
		case 'inc': return [types[node.type], node.name, serializeOne(node.expr)];
		case 'dec': return [types[node.type], node.name, serializeOne(node.expr)];
		case 'attr': return [types[node.type], node.name, serializeOne(node.value)];
		case 'break': return [types[node.type], null];
		case 'loop': return [types[node.type], serialize(node.statements)];
		case 'continue': return [types[node.type], null];
		case 'infix': return [types[node.type], serialize(node.operands), serialize(node.operators)];
		case 'operator': return [types[node.type], node.op];
	}
}

export function serialize(ast: Node[]): Bin[] {
	return ast.map(x => serializeOne(x)!);
}

export function deserializeOne(bin: Bin | null): Node | undefined {
	if (bin == null) return undefined;
	const type = Object.keys(types).find(x => types[x] === bin[0]);
	switch (bin[0]) {
		case types.def: return { type, name: bin[1], mut: bin[2], expr: deserializeOne(bin[3]), attr: deserialize(bin[4]), } as NDef;
		case types.assign: return { type, name: bin[1], expr: deserializeOne(bin[2]), } as NAssign;
		case types.call: return { type, name: bin[1], args: deserialize(bin[2]), } as NCall;
		case types.return: return { type, expr: deserializeOne(bin[1]), } as NReturn;
		case types.if: return { type, cond: deserializeOne(bin[1]), then: deserializeOne(bin[2]), elseif: bin[3].map(x => ({ cond: deserializeOne(x[0]), then: deserializeOne(x[1]) })), else: deserializeOne(bin[4]), } as NIf;
		case types.for: return { type, var: bin[1] || undefined, from: deserializeOne(bin[2]), to: deserializeOne(bin[3]), times: deserializeOne(bin[4]), for: deserializeOne(bin[5]), } as NFor;
		case types.forOf: return { type, var: bin[1], items: deserializeOne(bin[2]), for: deserializeOne(bin[3]), } as NForOf;
		case types.var: return { type, name: bin[1], } as NVar;
		case types.null: return { type, } as NNull;
		case types.bool: return { type, value: bin[1], } as NBool;
		case types.num: return { type, value: bin[1], } as NNum;
		case types.str: return { type, value: bin[1], } as NStr;
		case types.arr: return { type, value: deserialize(bin[1]), } as NArr;
		case types.fn: return { type, args: bin[1], children: deserialize(bin[2]), } as NFn;
		case types.obj: return { type, value: new Map(bin[1].map(x => [x[0], deserializeOne(x[1])])), } as NObj;
		case types.prop: return { type, obj: bin[1], path: bin[2], } as NProp;
		case types.propCall: return { type, obj: bin[1], path: bin[2], args: deserialize(bin[3]), } as NPropCall;
		case types.index: return { type, arr: bin[1], i: deserializeOne(bin[2]), } as NIndex;
		case types.block: return { type, statements: deserialize(bin[1]), } as NBlock;
		case types.tmpl: return { type, tmpl: bin[1].map(x => typeof x === 'string' ? x : deserializeOne(x)), } as NTmpl;
		case types.ns: return { type, name: bin[1], members: deserialize(bin[2]), } as NNs;
		case types.match: return { type, about: deserializeOne(bin[1]), qs: bin[2].map(x => ({ q: deserializeOne(x[0]), a: deserializeOne(x[1]) })), default: deserializeOne(bin[3]), } as NMatch;
		case types.meta: return { type, name: bin[1], value: deserializeOne(bin[2]), } as NMeta;
		case types.propAssign: return { type, obj: bin[1], path: bin[2], expr: deserializeOne(bin[3]), } as NPropAssign;
		case types.indexAssign: return { type, arr: bin[1], i: deserializeOne(bin[2]), expr: deserializeOne(bin[3]), } as NIndexAssign;
		case types.inc: return { type, name: bin[1], expr: deserializeOne(bin[2]), } as NInc;
		case types.dec: return { type, name: bin[1], expr: deserializeOne(bin[2]), } as NDec;
		case types.attr: return { type, name: bin[1], value: deserializeOne(bin[2]) } as NAttr;
		case types.break: return { type, name: bin[1], value: deserializeOne(null) } as NBreak;
		case types.loop: return { type, statements: deserialize(bin[1]), } as NLoop;
		case types.continue: return { type, name: bin[1], value: deserializeOne(null) } as NContinue;
		case types.infix: return { type, operands: deserialize(bin[1]), operators: deserialize(bin[2])} as NInfix;
		case types.operator: return { type, op: bin[1] } as NOperator;
	}
	throw new Error("deserialization failed");
}

export function deserialize(bin: Bin[]): Node[] {
	return bin.map(x => deserializeOne(x)!);
}
