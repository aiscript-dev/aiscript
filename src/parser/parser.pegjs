{
	function applyParser(input, startRule) {
		let parseFunc = peg$parse;
		return parseFunc(input, startRule ? { startRule } : { });
	}
	function createNode(type, params, children) {
		const node = { type };
		params.children = children;
		for (const key of Object.keys(params)) {
			if (params[key] !== undefined) {
				node[key] = params[key];
			}
		}
		const loc = location();
		node.loc = { start: loc.start.offset, end: loc.end.offset - 1 };
		return node;
	}
	const {
		concatTemplate
	} = require('./util');
}

// First, comments are removed by the entry rule, then the core parser is applied to the code.
Entry
	= parts:PreprocessPart*
{ return applyParser(parts.join(''), 'Core'); }

PreprocessPart
	= Tmpl { return text(); }
	/ Str { return text(); }
	/ Comment { return ''; }
	/ .

Comment
	= "//" (!EOL .)*

//
// core parser
//

Core
	= _ content:GlobalStatements? _
{ return content || []; }

GlobalStatements
	= head:GlobalStatement tails:(___ s:GlobalStatement { return s; })*
{ return [head, ...tails]; }

Statements
	= head:Statement tails:(___ s:Statement { return s; })*
{ return [head, ...tails]; }

// list of global statements

GlobalStatement
	= Namespace // "::"
	/ Meta      // "###"
	/ Statement

// list of statement

Statement
	= VarDef      // "#" NAME | "$" NAME
	/ FnDef       // "@"
	/ Out         // "<:"
	/ Debug       // "<<<"
	/ Return      // "return"
	/ Attr        // "+"
	/ ForOf       // "~~" | "each"
	/ For         // "~" | "for"
	/ Loop        // "loop"
	/ Break       // "break"
	/ Continue    // "continue"
	/ Assign      // NAME_WITH_NAMESPACE "<-"
	/ PropAssign  // NAME_WITH_NAMESPACE "."
	/ IndexAssign // NAME_WITH_NAMESPACE "["
	/ Inc         // NAME_WITH_NAMESPACE "+<-"
	/ Dec         // NAME_WITH_NAMESPACE "-<-"
	/ Expr

// list of expression

Expr
	= Infix
	/ Term

// list of term expression

Term
	= If          // "if"
	/ Fn          // "@("
	/ Match       // "match"
	/ Block       // "{"
	/ Literal
	/ Call        // NAME_WITH_NAMESPACE "("
	/ IndexRef    // NAME_WITH_NAMESPACE "["
	/ PropCall    // NAME_WITH_NAMESPACE "."
	/ PropRef     // NAME_WITH_NAMESPACE "."
	/ VarRef      // NAME_WITH_NAMESPACE
	/ "(" _ e:Expr _ ")" { return e; }

// list of literal

Literal
	= Tmpl        // "`"
	/ Str         // "\""
	/ Num         // "+" | "-" | "1"~"9"
	/ Bool        // "yes" | "no" | "+" | "-"
	/ Null        // "_"
	/ Obj         // "{"
	/ Arr         // "["

// list of static literal

StaticLiteral
	= Num
	/ Str
	/ Bool
	/ StaticArr
	/ StaticObj
	/ Null



//
// global statements ---------------------------------------------------------------------
// 

// namespace statement

Namespace
	= "::" ___ name:NAME ___ "{" _ members:NamespaceMembers? _ "}"
{ return createNode('ns', { name, members }); }

NamespaceMembers
	= head:NamespaceMember tails:(___ s:NamespaceMember { return s; })*
{ return [head, ...tails]; }

NamespaceMember
	= VarDef
	/ FnDef
	/ Namespace

// meta statement

Meta
	= "###" __ name:NAME _ value:StaticLiteral
{ return createNode('meta', { name, value }); }
	/ "###" __ value:StaticLiteral
{ return createNode('meta', { name: null, value }); }



//
// statements ----------------------------------------------------------------------------
//

// define statement

VarDef
	= "#" name:NAME _ "=" _ expr:Expr
{ return createNode('def', { name, expr, mut: false, attr: [] }); }
	/ "$" name:NAME _ "<-" _ expr:Expr
{ return createNode('def', { name, expr, mut: true, attr: [] }); }

// output statement

// NOTE: syntax sugar for print()
Out
	= "<:" _ expr:Expr
{ return createNode('call', { name: 'print', args: [expr] }); }

// debug statement

Debug
	= "<<<" _ expr:Expr
{ return createNode('debug', { expr }); }

// attribute statement

// Note: Attribute will be combined with def node when parsing is complete.
Attr
	= "+" __ name:NAME _ value:StaticLiteral
{ return createNode('attr', { name, value }); }

// for-of statement

// TODO: ~~ の方の構文は将来的に消す
ForOf
	= "~~" _ "(" "#" varn:NAME _ ","? _ items:Expr ")" _ x:Statement
{
	return createNode('forOf', {
		var: varn,
		items: items,
		for: x,
	});
}
	/ "~~" ___ "#" varn:NAME _ ","? _ items:Expr ___ x:Statement
{
	return createNode('forOf', {
		var: varn,
		items: items,
		for: x,
	});
}
	/ "each" _ "(" "#" varn:NAME _ ","? _ items:Expr ")" _ x:Statement
{
	return createNode('forOf', {
		var: varn,
		items: items,
		for: x,
	});
}
	/ "each" ___ "#" varn:NAME _ ","? _ items:Expr ___ x:Statement
{
	return createNode('forOf', {
		var: varn,
		items: items,
		for: x,
	});
}

// for statement

// TODO: ~ の方の構文は将来的に消す
For
	= "~" _ "(" "#" varn:NAME _ from:("=" _ v:Expr { return v; })? ","? _ to:Expr ")" _ x:Statement
{
	return createNode('for', {
		var: varn,
		from: from || createNode('num', { value: 0 }),
		to: to,
		for: x,
	});
}
	/ "~" ___ "#" varn:NAME _ from:("=" _ v:Expr { return v; })? ","? _ to:Expr ___ x:Statement
{
	return createNode('for', {
		var: varn,
		from: from || createNode('num', { value: 0 }),
		to: to,
		for: x,
	});
}
	/ "~" _ "(" times:Expr ")" _ x:Statement
{
	return createNode('for', {
		times: times,
		for: x,
	});
}
	/ "~" ___ times:Expr ___ x:Statement
{
	return createNode('for', {
		times: times,
		for: x,
	});
}
	/ "for" _ "(" "#" varn:NAME _ from:("=" _ v:Expr { return v; })? ","? _ to:Expr ")" _ x:Statement
{
	return createNode('for', {
		var: varn,
		from: from || createNode('num', { value: 0 }),
		to: to,
		for: x,
	});
}
	/ "for" ___ "#" varn:NAME _ from:("=" _ v:Expr { return v; })? ","? _ to:Expr ___ x:Statement
{
	return createNode('for', {
		var: varn,
		from: from || createNode('num', { value: 0 }),
		to: to,
		for: x,
	});
}
	/ "for" _ "(" times:Expr ")" _ x:Statement
{
	return createNode('for', {
		times: times,
		for: x,
	});
}
	/ "for" ___ times:Expr ___ x:Statement
{
	return createNode('for', {
		times: times,
		for: x,
	});
}

// return statement

Return
	= "return" _ expr:Expr
{ return createNode('return', { expr }); }

// loop statement

Loop
	= "loop" _ "{" _ s:Statements _ "}"
{ return createNode('loop', { statements: s }); }

// break

Break
	= "break" ![A-Z0-9_:]i
{ return createNode('break', {}); }

// continue

Continue
	= "continue" ![A-Z0-9_:]i
{ return createNode('continue', {}); }

// assign statement

Assign
	= name:NAME_WITH_NAMESPACE _ "<-" _ expr:Expr
{ return createNode('assign', { name, expr }); }

// property assign statement

PropAssign
	= head:NAME_WITH_NAMESPACE tails:("." name:NAME { return name; })+ _ "<-" _ expr:Expr
{ return createNode('propAssign', { obj: head, path: tails, expr }); }


// indexer assign statement

IndexAssign
	= v:NAME_WITH_NAMESPACE "[" _ i:Expr _ "]" _ "<-" _ expr:Expr
{ return createNode('indexAssign', { arr: v, i: i, expr }); }

// increment statement

Inc
	= name:NAME_WITH_NAMESPACE _ "+<-" _ expr:Expr
{ return createNode('inc', { name, expr }); }

// decrement statement

Dec
	= name:NAME_WITH_NAMESPACE _ "-<-" _ expr:Expr
{ return createNode('dec', { name, expr }); }



//
// expressions --------------------------------------------------------------------
//

// infix expression

Infix
	= s:Term rest:(_ o:Op _ t:Term { return {o, t}; })+
{
	return createNode('infix', {
		operands: [s, ...rest.map(r => r.t)],
		operators: rest.map(r => r.o)
	});
}

// NOTE: sequences that have syntax meaning; don't treat them as operators
ReservedOps
	= "<<<" / "=>" / "<-" / "+<-" / "-<-"

Op
	= !(ReservedOps ![-+*/%&|=~<>!?]) [-+*/%&|=~<>!?]+ { return createNode('operator', { op: text() }); }

// if statement

If
	= "if" ___ cond:Expr ___ then:Statement elseif:(___ b:ElseifBlocks { return b; })? elseBlock:(___ b:ElseBlock { return b; })?
{
	return createNode('if', {
		cond: cond,
		then: then,
		elseif: elseif || [],
		else: elseBlock
	});
}
// TODO: 将来的に削除
	/ "?" ___ cond:Expr ___ then:Expr elseif:(___ b:ElseifBlocks { return b; })? elseBlock:(___ b:ElseBlock { return b; })?
{
	return createNode('if', {
		cond: cond,
		then: then,
		elseif: elseif || [],
		else: elseBlock
	});
}

ElseifBlocks
	= head:ElseifBlock tails:(_ i:ElseifBlock { return i; })*
{ return [head, ...tails]; }

ElseifBlock
	= "elif" _ cond:Expr _ then:Statement
{ return { cond, then }; }
// TODO: 将来的に削除
	/ "."+ "?" _ cond:Expr _ then:Statement
{ return { cond, then }; }

ElseBlock
	= "else" _ then:Statement
{ return then; }
// TODO: 将来的に削除
	/ "."+ _ then:Statement
{ return then; }

// match expression

Match
	= "match" _ about:Expr _ "{" _ qs:(q:Expr _ "=>" _ a:Expr _ { return { q, a }; })+ x:("*" _ "=>" _ v:Expr _ { return v; })? _ "}"
{
	return createNode('match', {
		about: about,
		qs: qs || [],
		default: x
	});
}

// block expression

Block
	= "{" _ s:Statements _ "}"
{ return createNode('block', { statements: s }); }

// function call expression

Call
	= name:NAME_WITH_NAMESPACE "(" _ args:CallArgs? _ ")"
{ return createNode('call', { name, args: args || [] }); }

CallArgs
	= head:Expr tails:(","? ___ expr:Expr { return expr; })*
{ return [head, ...tails]; }

// reference of indexer expression

IndexRef
	= v:NAME_WITH_NAMESPACE "[" _ i:Expr _ "]"
{ return createNode('index', { arr: v, i: i }); }

// property call

PropCall
	= head:NAME_WITH_NAMESPACE tails:("." name:NAME { return name; })+ "(" _ args:CallArgs? _ ")"
{ return createNode('propCall', { obj: head, path: tails, args: args || [] }); }

// reference of property expression

PropRef
	= head:NAME_WITH_NAMESPACE tails:("." name:NAME { return name; })+
{ return createNode('prop', { obj: head, path: tails }); }

// reference of variable expression

VarRef
	= name:NAME_WITH_NAMESPACE
{ return createNode('var', { name }); }



//
// literals ------------------------------------------------------------------------------
//

// template literal

Tmpl
	= "`" items:(!"`" i:TmplEmbed { return i; })* "`"
{ return createNode('tmpl', { tmpl: concatTemplate(items) }); }

TmplEmbed
	= TmplEsc
	/ "{" __ expr:Expr __ "}"
{ return expr; }
	/ .

TmplEsc
	= "\\{" { return text()[1]; } // avoid syntax error of PEG.js (bug?)
	/ "\\}" { return text()[1]; } // avoid syntax error of PEG.js (bug?)
	/ "\\`" { return '`'; }

// string literal

Str
	= "\"" value:(!"\"" c:(StrEsc / .) { return c; })* "\""
{ return createNode('str', { value: value.join('') }); }

StrEsc
	= "\\\""
{ return '"'; }

// number literal

Num
	= [+-]? [1-9] [0-9]+
{ return createNode('num', { value: parseInt(text(), 10) }); }
	/ [+-]? [0-9]
{ return createNode('num', { value: parseInt(text(), 10) }); }

// boolean literal

Bool
	= True
	/ False

True
	= "yes" ![A-Z0-9_:]i
{ return createNode('bool', { value: true }); }
// TODO: 将来的に削除
	/ "+" ![A-Z0-9_:]i
{ return createNode('bool', { value: true }); }

False
	= "no" ![A-Z0-9_:]i
{ return createNode('bool', { value: false }); }
// TODO: 将来的に削除
	/ "-" ![A-Z0-9_:]i
{ return createNode('bool', { value: false }); }

// null literal

Null
	= "_" ![A-Z0-9_:]i
{ return createNode('null', {}); }

// object literal

Obj
	= "{" _ kvs:(k:NAME _ ":" ___ v:Expr _ ("," / ";")? _ { return { k, v }; })* "}"
{
	const obj = new Map();
	for (const kv of kvs) {
		obj.set(kv.k, kv.v);
	}
	return createNode('obj', { value: obj });
}

// array literal

Arr
	= "[" _ items:(item:Expr _ ","? _ { return item; })* _ "]"
{ return createNode('arr', { value: items }); }



//
// function ------------------------------------------------------------------------------
//

Args
	= head:NAME tails:(","? ___ name:NAME { return name; })*
{ return [head, ...tails]; }

// define function statement

FnDef
	= "@" name:NAME "(" _ args:Args? _ ")" _ "{" _ content:Statements? _ "}"
{
	return createNode('def', {
		name: name,
		expr: createNode('fn', { args }, content || []),
		mut: false,
		attr: []
	});
}

// function expression

Fn = "@(" _ args:Args? _ ")" _ "{" _ content:Statements? _ "}"
{ return createNode('fn', { args }, content || []); }



//
// static literal ------------------------------------------------------------------------
//

// array literal (static)

StaticArr
	= "[" _ items:(item:StaticLiteral _ ","? _ { return item; })* _ "]"
{ return createNode('arr', { value: items }); }

// object literal (static)

StaticObj
	= "{" _ kvs:(k:NAME _ ":" ___ v:StaticLiteral _ ("," / ";")? _ { return { k, v }; })* "}"
{
	const obj = new Map();
	for (const kv of kvs) {
		obj.set(kv.k, kv.v);
	}
	return createNode('obj', { value: obj });
}



//
// general -------------------------------------------------------------------------------
//

NAME
	= [A-Z_]i [A-Z0-9_]i*
{ return text(); }

NAME_WITH_NAMESPACE
	= NAME (":" NAME)*
{ return text(); }

EOL
	= !. / "\r\n" / [\r\n]

// optional spacing
_
	= [ \t\r\n]*

// optional spacing (no linebreaks)
__
	= [ \t]*

// required spacing
___
	= [ \t\r\n]+
