{
	function applyParser(input, startRule) {
		let parseFunc = peg$parse;
		return parseFunc(input, startRule ? { startRule } : { });
	}
	const {
		createNode,
		concatTemplate
	} = require('./util');
}

// First, comments are removed by the entry rule, then the core parser is applied to the code.
Entry
	= parts:PreprocessPart*
{ return applyParser(parts.join(''), 'Core'); }

PreprocessPart
	= Comment { return ''; }
	/ .

Comment
	= "//" (!EOL .)*

//
// core parser
//

Core
	= _ content:Statements? _
{ return content; }

Statements
	= head:Statement tails:(___ s:Statement { return s; })*
{ return [head, ...tails]; }

Statement
	= VarDef
	/ Assign
	/ Return
	/ Out
	/ FnDef
	/ Namespace
	/ Debug
	/ Expr

Expr
	= PropCall
	/ PropRef
	/ IndexRef
	/ If
	/ Match
	/ For
	/ ForOf
	/ Fn
	/ Num
	/ Tmpl
	/ Str
	/ Call
	/ Op
	/ Bool
	/ Arr
	/ Obj
	/ Null
	/ VarRef
	/ Block

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
	= "#" [ \t]* name:NAME _ "=" _ expr:Expr
{ return createNode('def', { name, expr, mut: false }); }
	/ "$" [ \t]* name:NAME _ "<-" _ expr:Expr
{ return createNode('def', { name, expr, mut: true }); }

// var reassign
Assign
	= name:NAME _ "<-" _ expr:Expr
{ return createNode('assign', { name, expr }); }

// statement of return
Return
	= "<<" _ expr:Expr
{ return createNode('return', { expr }); }

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
	= "{" __ expr:Expr __ "}"
{ return expr; }
	/ .

// string literal
Str
	= "\"" value:(!"\"" c:(StrEsc / .) { return c; })* "\""
{ return createNode('str', { value: value.join('') }); }

StrEsc
	= "\\\""
{ return '"'; }

// boolean literal
Bool
	= "yes" ![A-Z0-9_]i
{ return createNode('bool', { value: true }); }
	/ "no" ![A-Z0-9_]i
{ return createNode('bool', { value: false }); }

// array literal
Arr
	= "[" _ items:(item:Expr _ ","? _ { return item; })* _ "]"
{ return createNode('arr', { value: items }); }

// object literal
Obj
	= "{" _ kvs:(k:NAME _ ":" _ v:Expr _ ("," / ";")? _ { return { k, v }; })* "}"
{
	const obj = new Map();
	for (const kv of kvs) {
		obj.set(kv.k, kv.v);
	}
	return createNode('obj', { value: obj });
}

// null literal
Null
	= "_" ![A-Z0-9_]i
{ return createNode('null', {}); }

// block
Block
	= "{" _ s:Statements _ "}"
{ return createNode('block', { statements: s }); }

// function ------------------------------------------------------------------------------

Args
	= head:NAME_WITH_NAMESPACE tails:(_ "," _ name:NAME_WITH_NAMESPACE { return name; })*
{ return [head, ...tails]; }

// statement of function definition
FnDef
	= "@" name:NAME "(" _ args:Args? _ ")" _ "{" _ content:Statements? _ "}"
{
	return createNode('def', {
		name: name,
		expr: createNode('fn', { args }, content)
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
	= head:Expr tails:(_ "," _ expr:Expr { return expr; })*
{ return [head, ...tails]; }

// syntax sugers of operator function call
Ops
	= "=" { return 'Core:eq'; }
	/ "&" { return 'Core:and'; }
	/ "|" { return 'Core:or'; }
	/ "+" { return 'Core:add'; }
	/ "-" { return 'Core:sub'; }
	/ "*" { return 'Core:mul'; }
	/ "/" { return 'Core:div'; }
	/ "%" { return 'Core:mod'; }
	/ ">" { return 'Core:gt'; }
	/ "<" { return 'Core:lt'; }

Op
	= "(" _ expr1:Expr _ op:Ops _ expr2:Expr _ ")" { return createNode('call', { name: op, args: [expr1, expr2] }); }

// if statement --------------------------------------------------------------------------

If
	= "?" ___ cond:Expr ___ then:(Expr / Return) elseif:(_ b:ElseifBlocks { return b; })? elseBlock:(_ b:ElseBlock { return b; })?
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
	= "."+ "?" _ cond:Expr _ then:(Expr / Return)
{ return { cond, then }; }

ElseBlock
	= "."+ _ then:(Expr / Return)
{ return then; }

// match --------------------------------------------------------------------------

Match
	= "?" _ about:Expr _ "{" _ qs:(q:Expr _ "=>" _ a:Expr _ { return { q, a }; })+ x:("*" _ "=>" _ v:Expr _ { return v; })? _ "}"
{
	return createNode('match', {
		about: about,
		qs: qs || [],
		default: x
	});
}

// for statement -------------------------------------------------------------------------

For
	= "~" ___ "#" varn:NAME _ from:("=" _ v:Expr { return v; })? ","? _ to:Expr ___ "{" _ s:Statements _ "}"
{
	return createNode('for', {
		var: varn,
		from: from || createNode('num', { value: 0 }),
		to: to,
		s: s,
	});
}
	/ "~" ___ times:Expr ___ "{" _ s:Statements _ "}"
{
	return createNode('for', {
		times: times,
		s: s,
	});
}

// for of statement -------------------------------------------------------------------------

ForOf
	= "~~" ___ "#" varn:NAME _ ","? _ items:Expr ___ "{" _ s:Statements _ "}"
{
	return createNode('forOf', {
		var: varn,
		items: items,
		s: s,
	});
}

// general -------------------------------------------------------------------------------

IgnoredName
	= "_"
	/ "yes"
	/ "no"

NAME
	= !(IgnoredName ![A-Z0-9_]i) [A-Z_]i [A-Z0-9_]i*
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
