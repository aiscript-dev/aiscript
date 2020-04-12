{
	function applyParser(input, startRule) {
		let parseFunc = peg$parse;
		return parseFunc(input, startRule ? { startRule } : { });
	}
	function createNode(type, params, children) {
		const node = { type };
		params.children = children;
		for (const key of Object.keys(params)) {
			if (params[key] != null) {
				node[key] = params[key];
			}
		}
		return node;
	}
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
	/ For
	/ Debug
	/ Expr

Expr
	= PropRef
	/ IndexRef
	/ If
	/ Fn
	/ Num
	/ Str
	/ Call
	/ Ops
	/ Bool
	/ Arr
	/ Obj
	/ Null
	/ VarRef
	/ Block

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

// string literal
Str
	= "\"" value:$(!"\"" .)* "\""
{ return createNode('str', { value }); }

// boolean literal
Bool
	= "yes"
{ return createNode('bool', { value: true }); }
	/ "no"
{ return createNode('bool', { value: false }); }

// array literal
Arr
	= "[" _ items:(item:Expr _ ","? _ { return item; })* _ "]"
{ return createNode('arr', { value: items }); }

// object literal
Obj
	= "{" _ kvs:(k:NAME _ ":" _ v:Expr _ ";" _ { return { k, v }; })* "}"
{
	const obj = new Map();
	for (const kv of kvs) {
		obj.set(kv.k, kv.v);
	}
	return createNode('obj', { value: obj });
}

// null literal
Null
	= "_"
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
	= "(" _ expr1:Expr _ "=" _ expr2:Expr _ ")" { return createNode('call', { name: 'eq', args: [expr1, expr2] }); }
	/ "(" _ expr1:Expr _ "&" _ expr2:Expr _ ")" { return createNode('call', { name: 'and', args: [expr1, expr2] }); }
	/ "(" _ expr1:Expr _ "|" _ expr2:Expr _ ")" { return createNode('call', { name: 'or', args: [expr1, expr2] }); }
	/ "(" _ expr1:Expr _ "+" _ expr2:Expr _ ")" { return createNode('call', { name: 'add', args: [expr1, expr2] }); }
	/ "(" _ expr1:Expr _ "-" _ expr2:Expr _ ")" { return createNode('call', { name: 'sub', args: [expr1, expr2] }); }
	/ "(" _ expr1:Expr _ "*" _ expr2:Expr _ ")" { return createNode('call', { name: 'mul', args: [expr1, expr2] }); }
	/ "(" _ expr1:Expr _ "/" _ expr2:Expr _ ")" { return createNode('call', { name: 'div', args: [expr1, expr2] }); }
	/ "(" _ expr1:Expr _ "%" _ expr2:Expr _ ")" { return createNode('call', { name: 'mod', args: [expr1, expr2] }); }
	/ "(" _ expr1:Expr _ ">" _ expr2:Expr _ ")" { return createNode('call', { name: 'gt', args: [expr1, expr2] }); }
	/ "(" _ expr1:Expr _ "<" _ expr2:Expr _ ")" { return createNode('call', { name: 'lt', args: [expr1, expr2] }); }

// if statement --------------------------------------------------------------------------

If
	= "?" _ cond:Expr _ "{" _ then:Statements? _ "}" elseif:(_ b:ElseifBlocks { return b; })? elseBlock:(_ b:ElseBlock { return b; })?
{
	return createNode('if', {
		cond: cond,
		then: then || [],
		elseif: elseif || [],
		else: elseBlock || []
	});
}

ElseifBlocks
	= head:ElseifBlock tails:(_ i:ElseifBlock { return i; })*
{ return [head, ...tails]; }

ElseifBlock
	= "...?" _ cond:Expr _ "{" _ then:Statements? _ "}"
{ return { cond, then }; }

ElseBlock
	= "..." _ "{" _ then:Statements? _ "}"
{ return then; }

// for statement -------------------------------------------------------------------------

For
	= "~" ___ "#" varn:NAME _ from:("=" _ v:Expr { return v; })? "," _ to:Expr ___ "{" _ s:Statements _ "}"
{
	return createNode('for', {
		var: varn,
		from: from || createNode('num', { value: 0 }),
		to: to,
		s: s,
	});
}

// general -------------------------------------------------------------------------------

NAME = [A-Za-z_] [A-Za-z0-9_]* { return text(); }

NAME_WITH_NAMESPACE = NAME (":" NAME)? { return text(); }

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
