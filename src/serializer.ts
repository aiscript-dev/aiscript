import { Node, NDef, NAssign, NCall, NReturn, NIf, NFor, NForOf, NVar, NNull, NBool, NNum, NStr, NArr, NFn, NObj, NProp, NPropCall, NIndex, NBlock, NTmpl, NNs, NMatch, NMeta, NPropAssign, NIndexAssign, NInc, NDec, NAttr } from './node';

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
};

type Bin = any[];

export function serializeOne(node: Node | null | undefined): Bin | null {
	if (node == null) return null;
	switch (node.type) {
		case 'def': return [types[node.type], node.loc.start, node.loc.end, node.name, node.mut, serializeOne(node.expr), serialize(node.attr)];
		case 'assign': return [types[node.type], node.loc.start, node.loc.end, node.name, serializeOne(node.expr)];
		case 'call': return [types[node.type], node.loc.start, node.loc.end, node.name, serialize(node.args)];
		case 'return': return [types[node.type], node.loc.start, node.loc.end, serializeOne(node.expr)];
		case 'if': return [types[node.type], node.loc.start, node.loc.end, serializeOne(node.cond), serializeOne(node.then), node.elseif.map(x => [serializeOne(x.cond), serializeOne(x.then)]), serializeOne(node.else)];
		case 'for': return [types[node.type], node.loc.start, node.loc.end, node.var, serializeOne(node.from), serializeOne(node.to), serializeOne(node.times), serializeOne(node.for)];
		case 'forOf': return [types[node.type], node.loc.start, node.loc.end, node.var, serializeOne(node.items), serializeOne(node.for)];
		case 'var': return [types[node.type], node.loc.start, node.loc.end, node.name];
		case 'null': return [types[node.type], node.loc.start, node.loc.end];
		case 'bool': return [types[node.type], node.loc.start, node.loc.end, node.value];
		case 'num': return [types[node.type], node.loc.start, node.loc.end, node.value];
		case 'str': return [types[node.type], node.loc.start, node.loc.end, node.value];
		case 'arr': return [types[node.type], node.loc.start, node.loc.end, serialize(node.value)];
		case 'fn': return [types[node.type], node.loc.start, node.loc.end, node.args, serialize(node.children)];
		case 'obj': return [types[node.type], node.loc.start, node.loc.end, Array.from(node.value.entries()).map(x => [x[0], serializeOne(x[1])])];
		case 'prop': return [types[node.type], node.loc.start, node.loc.end, node.obj, node.path];
		case 'propCall': return [types[node.type], node.loc.start, node.loc.end, node.obj, node.path, serialize(node.args)];
		case 'index': return [types[node.type], node.loc.start, node.loc.end, node.arr, serializeOne(node.i)];
		case 'block': return [types[node.type], node.loc.start, node.loc.end, serialize(node.statements)];
		case 'tmpl': return [types[node.type], node.loc.start, node.loc.end, node.tmpl.map(x => typeof x === 'string' ? x : serializeOne(x))];
		case 'ns': return [types[node.type], node.loc.start, node.loc.end, node.name, serialize(node.members)];
		case 'match': return [types[node.type], node.loc.start, node.loc.end, serializeOne(node.about), node.qs.map(x => [serializeOne(x.q), serializeOne(x.a)]), serializeOne(node.default)];
		case 'meta': return [types[node.type], node.loc.start, node.loc.end, node.name, serializeOne(node.value)];
		case 'propAssign': return [types[node.type], node.loc.start, node.loc.end, node.obj, node.path, serializeOne(node.expr)];
		case 'indexAssign': return [types[node.type], node.loc.start, node.loc.end, node.arr, serializeOne(node.i), serializeOne(node.expr)];
		case 'inc': return [types[node.type], node.loc.start, node.loc.end, node.name, serializeOne(node.expr)];
		case 'dec': return [types[node.type], node.loc.start, node.loc.end, node.name, serializeOne(node.expr)];
		case 'attr': return [types[node.type], node.loc.start, node.loc.end, node.name, serializeOne(node.value)];
	}
}

export function serialize(ast: Node[]): Bin[] {
	return ast.map(x => serializeOne(x)!);
}

export function deserializeOne(bin: Bin | null): Node | undefined {
	if (bin == null) return undefined;
	const type = Object.keys(types).find(x => types[x] === bin[0]);
	switch (bin[0]) {
		case types.def: return { type, loc: { start: bin[1], end: bin[2], }, name: bin[3], mut: bin[4], expr: deserializeOne(bin[5]), attr: deserialize(bin[6]), } as NDef;
		case types.assign: return { type, loc: { start: bin[1], end: bin[2], }, name: bin[3], expr: deserializeOne(bin[4]), } as NAssign;
		case types.call: return { type, loc: { start: bin[1], end: bin[2], }, name: bin[3], args: deserialize(bin[4]), } as NCall;
		case types.return: return { type, loc: { start: bin[1], end: bin[2], }, expr: deserializeOne(bin[3]), } as NReturn;
		case types.if: return { type, loc: { start: bin[1], end: bin[2], }, cond: deserializeOne(bin[3]), then: deserializeOne(bin[4]), elseif: bin[5].map(x => ({ cond: deserializeOne(x[0]), then: deserializeOne(x[1]) })), else: deserializeOne(bin[6]), } as NIf;
		case types.for: return { type, loc: { start: bin[1], end: bin[2], }, var: bin[3] || undefined, from: deserializeOne(bin[4]), to: deserializeOne(bin[5]), times: deserializeOne(bin[6]), for: deserializeOne(bin[7]), } as NFor;
		case types.forOf: return { type, loc: { start: bin[1], end: bin[2], }, var: bin[3], items: deserializeOne(bin[4]), for: deserializeOne(bin[5]), } as NForOf;
		case types.var: return { type, loc: { start: bin[1], end: bin[2], }, name: bin[3], } as NVar;
		case types.null: return { type, loc: { start: bin[1], end: bin[2], }, } as NNull;
		case types.bool: return { type, loc: { start: bin[1], end: bin[2], }, value: bin[3], } as NBool;
		case types.num: return { type, loc: { start: bin[1], end: bin[2], }, value: bin[3], } as NNum;
		case types.str: return { type, loc: { start: bin[1], end: bin[2], }, value: bin[3], } as NStr;
		case types.arr: return { type, loc: { start: bin[1], end: bin[2], }, value: deserialize(bin[3]), } as NArr;
		case types.fn: return { type, loc: { start: bin[1], end: bin[2], }, args: bin[3], children: deserialize(bin[4]), } as NFn;
		case types.obj: return { type, loc: { start: bin[1], end: bin[2], }, value: new Map(bin[3].map(x => [x[0], deserializeOne(x[1])])), } as NObj;
		case types.prop: return { type, loc: { start: bin[1], end: bin[2], }, obj: bin[3], path: bin[4], } as NProp;
		case types.propCall: return { type, loc: { start: bin[1], end: bin[2], }, obj: bin[3], path: bin[4], args: deserialize(bin[5]), } as NPropCall;
		case types.index: return { type, loc: { start: bin[1], end: bin[2], }, arr: bin[3], i: deserializeOne(bin[4]), } as NIndex;
		case types.block: return { type, loc: { start: bin[1], end: bin[2], }, statements: deserialize(bin[3]), } as NBlock;
		case types.tmpl: return { type, loc: { start: bin[1], end: bin[2], }, tmpl: bin[3].map(x => typeof x === 'string' ? x : deserializeOne(x)), } as NTmpl;
		case types.ns: return { type, loc: { start: bin[1], end: bin[2], }, name: bin[3], members: deserialize(bin[4]), } as NNs;
		case types.match: return { type, loc: { start: bin[1], end: bin[2], }, about: deserializeOne(bin[3]), qs: bin[4].map(x => ({ q: deserializeOne(x[0]), a: deserializeOne(x[1]) })), default: deserializeOne(bin[5]), } as NMatch;
		case types.meta: return { type, loc: { start: bin[1], end: bin[2], }, name: bin[3], value: deserializeOne(bin[4]), } as NMeta;
		case types.propAssign: return { type, loc: { start: bin[1], end: bin[2], }, obj: bin[3], path: bin[4], expr: deserializeOne(bin[5]), } as NPropAssign;
		case types.indexAssign: return { type, loc: { start: bin[1], end: bin[2], }, arr: bin[3], i: deserializeOne(bin[4]), expr: deserializeOne(bin[5]), } as NIndexAssign;
		case types.inc: return { type, loc: { start: bin[1], end: bin[2], }, name: bin[3], expr: deserializeOne(bin[4]), } as NInc;
		case types.dec: return { type, loc: { start: bin[1], end: bin[2], }, name: bin[3], expr: deserializeOne(bin[4]), } as NDec;
		case types.attr: return { type, loc: { start: bin[1], end: bin[2], }, name: bin[3], value: deserializeOne(bin[4]) } as NAttr;
	}
	throw new Error("deserialization failed");
}

export function deserialize(bin: Bin[]): Node[] {
	return bin.map(x => deserializeOne(x)!);
}
