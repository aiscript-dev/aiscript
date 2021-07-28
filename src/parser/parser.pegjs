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
{ return content; }

GlobalStatements
	= head:GlobalStatement tails:(___ s:GlobalStatement { return s; })*
{ return [head, ...tails]; }

GlobalStatement
	= Namespace // "::"
	/ Meta      // "###"
	/ Statement

Statements
	= head:Statement tails:(___ s:Statement { return s; })*
{ return [head, ...tails]; }

Statement
	= VarDef      // "#" | "$"
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
	/ Assign      // NAME "<-"
	/ PropAssign  // NAME_WITH_NAMESPACE "."
	/ IndexAssign // NAME_WITH_NAMESPACE "["
	/ Inc         // NAME_WITH_NAMESPACE "+<-"
	/ Dec         // NAME_WITH_NAMESPACE "-<-"
	/ Expr

Expr
	= If          // "if"
	/ Fn          // "@("
	/ Match       // "match"
	/ Block	      // "{"
	/ Infix
	/ Term

Term
	= Literal
	/ Call        // NAME_WITH_NAMESPACE "("
	/ IndexRef    // NAME_WITH_NAMESPACE "["
	/ PropCall    // NAME_WITH_NAMESPACE "."
	/ PropRef     // NAME_WITH_NAMESPACE "."
	/ VarRef		  // NAME_WITH_NAMESPACE
	/ "(" _ e:Expr _ ")" { return e; }

Literal
	= Tmpl 			  // "`"
	/ Str         // "\""
	/ Num         // "+" | "-" | "1"~"9"
	/ Bool        // "yes" | "no" | "+" | "-"
	/ Null        // "_"
	/ Obj         // "{"
	/ Arr         // "["

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

// statement of variable definition
VarDef
	= "#" name:NAME _ "=" _ expr:Expr
{ return createNode('def', { name, expr, mut: false, attr: [] }); }
	/ "$" name:NAME _ "<-" _ expr:Expr
{ return createNode('def', { name, expr, mut: true, attr: [] }); }

// var reassign
Assign
	= name:NAME_WITH_NAMESPACE _ "<-" _ expr:Expr
{ return createNode('assign', { name, expr }); }

// property assign
PropAssign
	= head:NAME_WITH_NAMESPACE tails:("." name:NAME { return name; })+ _ "<-" _ expr:Expr
{ return createNode('propAssign', { obj: head, path: tails, expr }); }

// array index assign
IndexAssign
	= v:NAME_WITH_NAMESPACE "[" _ i:Expr _ "]" _ "<-" _ expr:Expr
{ return createNode('indexAssign', { arr: v, i: i, expr }); }

// increment
Inc
	= name:NAME_WITH_NAMESPACE _ "+<-" _ expr:Expr
{ return createNode('inc', { name, expr }); }

// decrement
Dec
	= name:NAME_WITH_NAMESPACE _ "-<-" _ expr:Expr
{ return createNode('dec', { name, expr }); }

// syntax suger of print()
Out
	= "<:" _ expr:Expr
{ return createNode('call', { name: 'print', args: [expr] }); }

Debug
	= "<<<" _ expr:Expr
{ return createNode('debug', { expr }); }

// general expression --------------------------------------------------------------------

// variable reference
VarRef
	= name:NAME_WITH_NAMESPACE
{ return createNode('var', { name }); }

// property reference
PropRef
	= head:NAME_WITH_NAMESPACE tails:("." name:NAME { return name; })+
{ return createNode('prop', { obj: head, path: tails }); }

// property call
PropCall
	= head:NAME_WITH_NAMESPACE tails:("." name:NAME { return name; })+ "(" _ args:CallArgs? _ ")"
{ return createNode('propCall', { obj: head, path: tails, args: args || [] }); }

// index reference
IndexRef
	= v:NAME_WITH_NAMESPACE "[" _ i:Expr _ "]"
{ return createNode('index', { arr: v, i: i }); }

// number literal
Num
	= [+-]? [1-9] [0-9]+
{ return createNode('num', { value: parseInt(text(), 10) }); }
	/ [+-]? [0-9]
{ return createNode('num', { value: parseInt(text(), 10) }); }

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

// boolean literal
Bool
	= ("yes" / "+") ![A-Z0-9_:]i
{ return createNode('bool', { value: true }); }
	/ ("no" / "-") ![A-Z0-9_:]i
{ return createNode('bool', { value: false }); }

// array literal
Arr
	= "[" _ items:(item:Expr _ ","? _ { return item; })* _ "]"
{ return createNode('arr', { value: items }); }

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

// null literal
Null
	= "_" ![A-Z0-9_:]i
{ return createNode('null', {}); }

// block
Block
	= "{" _ s:Statements _ "}"
{ return createNode('block', { statements: s }); }

// return
Return
	= "return" _ expr:Expr
{ return createNode('return', { expr }); }

// break
Break
	= "break" ![A-Z0-9_:]i
{ return createNode('break', {}); }

// continue
Continue
	= "continue" ![A-Z0-9_:]i
{ return createNode('continue', {}); }

// function ------------------------------------------------------------------------------

Args
	= head:NAME tails:(","? ___ name:NAME { return name; })*
{ return [head, ...tails]; }

// statement of function definition
FnDef
	= "@" name:NAME "(" _ args:Args? _ ")" _ "{" _ content:Statements? _ "}"
{
	return createNode('def', {
		name: name,
		expr: createNode('fn', { args }, content),
		mut: false,
		attr: []
	});
}

// function
Fn = "@(" _ args:Args? _ ")" _ "{" _ content:Statements? _ "}"
{ return createNode('fn', { args }, content); }

// function call
Call
	= name:NAME_WITH_NAMESPACE "(" _ args:CallArgs? _ ")"
{ return createNode('call', { name, args: args || [] }); }

CallArgs
	= head:Expr tails:(","? ___ expr:Expr { return expr; })*
{ return [head, ...tails]; }

Op
	= op:(!ReservedOps [-+*/%&|=~<>!?]+) {	return createNode('operator', { op: text() }); }

// sequences that have syntax meaning; don't treat them as operators
ReservedOps
	= "<<" / "<:" / "=>" / "<-" / "+<-" / "-<-"

Infix
	= s:Term rest:(_ o:Op _ t:Term { return {o, t}; })+
{
	return createNode('infix', {
		operands: [s, ...rest.map(r => r.t)],
		operators: rest.map(r => r.o)
	});
}

// if statement --------------------------------------------------------------------------

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

// match --------------------------------------------------------------------------

Match
	= "match" _ about:Expr _ "{" _ qs:(q:Expr _ "=>" _ a:Expr _ { return { q, a }; })+ x:("*" _ "=>" _ v:Expr _ { return v; })? _ "}"
{
	return createNode('match', {
		about: about,
		qs: qs || [],
		default: x
	});
}

// loop statement ------------------------------------------------------------------------

Loop
	= "loop" _ "{" _ s:Statements _ "}"
{ return createNode('loop', { statements: s }); }

// for statement -------------------------------------------------------------------------

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

// for of statement -------------------------------------------------------------------------

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

// meta, attribute -----------------------------------------------------------------------

StaticLiteral
	= Num
	/ Str
	/ Bool
	/ StaticArr
	/ StaticObj
	/ Null

StaticArr
	= "[" _ items:(item:StaticLiteral _ ","? _ { return item; })* _ "]"
{ return createNode('arr', { value: items }); }

StaticObj
	= "{" _ kvs:(k:NAME _ ":" ___ v:StaticLiteral _ ("," / ";")? _ { return { k, v }; })* "}"
{
	const obj = new Map();
	for (const kv of kvs) {
		obj.set(kv.k, kv.v);
	}
	return createNode('obj', { value: obj });
}

Meta
	= "###" __ name:NAME _ value:StaticLiteral
{ return createNode('meta', { name, value }); }
	/ "###" __ value:StaticLiteral
{ return createNode('meta', { name: null, value }); }

// Note: Attribute will be combined with def node when parsing is complete.
Attr
	= "+" __ name:NAME _ value:StaticLiteral
{ return createNode('attr', { name, value }); }

// general -------------------------------------------------------------------------------

IgnoredName
	= "_"
	/ "yes"
	/ "no"
	/ "break"
	/ "continue"
	/ "each"
	/ "for"
	/ "match"
	/ "if"
	/ "elif"
	/ "else"
	/ "return"

NAME
	= !(IgnoredName ![A-Z0-9_:]i) [A-Z_]i [A-Z0-9_]i*
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
