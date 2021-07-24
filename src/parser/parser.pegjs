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
	= _ content:Statements? _
{ return content; }

Statements
	= head:Statement tails:(___ s:Statement { return s; })*
{ return [head, ...tails]; }

Statement
	= VarDef
	/ Assign
	/ PropAssign
	/ IndexAssign
	/ Inc
	/ Dec
	/ FnDef
	/ For
	/ ForOf
	/ Loop
	/ Namespace
	/ Meta
	/ Out
	/ Debug
	/ Attr
	/ Expr

Expr
	= PropCall
	/ PropRef
	/ IndexRef
	/ Return
	/ Break
	/ Continue
	/ If
	/ Match
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
	= "#" name:NAME _ "=" _ expr:Expr
{ return createNode('def', { name, expr, mut: false, attr: [] }); }
	/ "$" name:NAME _ "<-" _ expr:Expr
{ return createNode('def', { name, expr, mut: true, attr: [] }); }

// var reassign
Assign
	= name:NAME _ "<-" _ expr:Expr
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
	= name:NAME _ "+<-" _ expr:Expr
{ return createNode('inc', { name, expr }); }

// decrement
Dec
	= name:NAME _ "-<-" _ expr:Expr
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
	= ("yes" / "+") ![A-Z0-9_]i
{ return createNode('bool', { value: true }); }
	/ ("no" / "-") ![A-Z0-9_]i
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
	= "_" ![A-Z0-9_]i
{ return createNode('null', {}); }

// block
Block
	= "{" _ s:Statements _ "}"
{ return createNode('block', { statements: s }); }

// return
Return
	= "<<" _ expr:Expr
{ return createNode('return', { expr }); }

// break
Break
	= "break"
{ return createNode('break', {}); }

// continue
Continue
	= "continue"
{ return createNode('continue', {}); }

// function ------------------------------------------------------------------------------

Args
	= head:NAME_WITH_NAMESPACE tails:(","? ___ name:NAME_WITH_NAMESPACE { return name; })*
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

// syntax sugers of operator function call
Ops
	= "=" { return 'Core:eq'; }
	/ "!=" { return 'Core:neq'; }
	/ "&" { return 'Core:and'; }
	/ "|" { return 'Core:or'; }
	/ "+" { return 'Core:add'; }
	/ "-" { return 'Core:sub'; }
	/ "*" { return 'Core:mul'; }
	/ "/" { return 'Core:div'; }
	/ "%" { return 'Core:mod'; }
	/ ">=" { return 'Core:gteq'; }
	/ "<=" { return 'Core:lteq'; }
	/ ">" { return 'Core:gt'; }
	/ "<" { return 'Core:lt'; }

Op
	= "(" _ expr1:Expr _ op:Ops _ expr2:Expr _ ")" { return createNode('call', { name: op, args: [expr1, expr2] }); }

// if statement --------------------------------------------------------------------------

If
	= "?" ___ cond:Expr ___ then:Expr elseif:(___ b:ElseifBlocks { return b; })? elseBlock:(___ b:ElseBlock { return b; })?
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
	= "."+ "?" _ cond:Expr _ then:Expr
{ return { cond, then }; }

ElseBlock
	= "."+ _ then:Expr
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
	/ "~" ___ "#" varn:NAME _ from:("=" _ v:Expr { return v; })? ","? _ to:Expr _ x:Statement
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
	/ "~" ___ times:Expr _ x:Statement
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
	/ "for" ___ "#" varn:NAME _ from:("=" _ v:Expr { return v; })? ","? _ to:Expr _ x:Statement
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
	/ "for" ___ times:Expr _ x:Statement
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
	/ "~~" ___ "#" varn:NAME _ ","? _ items:Expr _ x:Statement
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
	/ "each" ___ "#" varn:NAME _ ","? _ items:Expr _ x:Statement
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
