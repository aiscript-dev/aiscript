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

start
	= preprocess

//
// preprocess parser
//

preprocess
	= parts:preprocess_part*
{ return applyParser(parts.join(''), 'main'); }

preprocess_part
	= comment { return ''; }
	/ not_comment { return text(); }

comment
	= "//" (!EOL .)*

not_comment
	= (!"//" .)+

//
// core parser
//

main
	= _ content:statements? _
{ return content; }

statements
	= head:statement tails:(___ s:statement { return s; })*
{ return [head, ...tails]; }

statement
	= varDefinition
	/ return
	/ fnDefinition
	/ if
	/ for
	/ fnObject
	/ numberLiteral
	/ stringLiteral
	/ fnCall
	/ opFnCall
	/ booleanLiteral
	/ variable

expression
	= if
	/ fnObject
	/ numberLiteral
	/ stringLiteral
	/ fnCall
	/ opFnCall
	/ booleanLiteral
	/ variable

// statement of variable definition
varDefinition
	= "#" [ \t]* name:NAME _ "=" _ expr:expression
{ return createNode('def', { name, expr: expr }); }

// statement of return
return
	= "<<" _ expr:expression
{ return createNode('return', { expr }); }

// general expression --------------------------------------------------------------------

// variable reference
variable
	= name:NAME
{ return createNode('var', { name }); }

// number literal
numberLiteral
	= [+-]? [1-9] [0-9]+
{ return createNode('num', { value: parseInt(text(), 10) }); }
	/ [+-]? [0-9]
{ return createNode('num', { value: parseInt(text(), 10) }); }

// string literal
stringLiteral
	= "\"" value:$(!"\"" .)* "\""
{ return createNode('str', { value }); }

// boolean literal
booleanLiteral
	= "yes"
{ return createNode('bool', { value: true }); }
	/ "no"
{ return createNode('bool', { value: false }); }

// function ------------------------------------------------------------------------------

fn_args
	= head:NAME tails:(_ "," _ name:NAME { return name; })*
{ return [head, ...tails]; }

// statement of function definition
fnDefinition
	= "@" name:NAME "(" _ args:fn_args? _ ")" _ "{" _ content:statements? _ "}"
{
	return createNode('def', {
		name: name,
		expr: createNode('fn', { args }, content)
	});
}

// function object
fnObject = "@(" _ args:fn_args? _ ")" _ "{" _ content:statements? _ "}"
{ return createNode('fn', { args }, content); }

// function call
fnCall
	= name:NAME "(" _ args:fnCall_args? _ ")"
{ return createNode('call', { name, args }); }

fnCall_args
	= head:expression tails:(_ "," _ expr:expression { return expr; })*
{ return [head, ...tails]; }

// syntax sugers of operator function call
opFnCall
	= "(" _ expr1:expression _ "=" _ expr2:expression _ ")" { return createNode('call', { name: 'eq', args: [expr1, expr2] }); }
	/ "(" _ expr1:expression _ "&" _ expr2:expression _ ")" { return createNode('call', { name: 'and', args: [expr1, expr2] }); }
	/ "(" _ expr1:expression _ "|" _ expr2:expression _ ")" { return createNode('call', { name: 'or', args: [expr1, expr2] }); }
	/ "(" _ expr1:expression _ "+" _ expr2:expression _ ")" { return createNode('call', { name: 'add', args: [expr1, expr2] }); }
	/ "(" _ expr1:expression _ "-" _ expr2:expression _ ")" { return createNode('call', { name: 'sub', args: [expr1, expr2] }); }
	/ "(" _ expr1:expression _ "*" _ expr2:expression _ ")" { return createNode('call', { name: 'mul', args: [expr1, expr2] }); }
	/ "(" _ expr1:expression _ "/" _ expr2:expression _ ")" { return createNode('call', { name: 'div', args: [expr1, expr2] }); }
	/ "(" _ expr1:expression _ "%" _ expr2:expression _ ")" { return createNode('call', { name: 'mod', args: [expr1, expr2] }); }
	/ "(" _ expr1:expression _ ">" _ expr2:expression _ ")" { return createNode('call', { name: 'gt', args: [expr1, expr2] }); }
	/ "(" _ expr1:expression _ "<" _ expr2:expression _ ")" { return createNode('call', { name: 'lt', args: [expr1, expr2] }); }

// if statement --------------------------------------------------------------------------

if
	= "?" _ cond:expression _ "{" _ then:statements? _ "}" elseif:(_ b:elseifBlocks { return b; })? elseBlock:(_ b:elseBlock { return b; })?
{
	return createNode('if', {
		cond: cond,
		then: then || [],
		elseif: elseif || [],
		else: elseBlock || []
	});
}

elseifBlocks
	= head:elseifBlock tails:(_ i:elseifBlock { return i; })*
{ return [head, ...tails]; }

elseifBlock
	= "...?" _ cond:expression _ "{" _ then:statements? _ "}"
{ return { cond, then }; }

elseBlock
	= "..." _ "{" _ then:statements? _ "}"
{ return then; }

// for statement -------------------------------------------------------------------------

for
	= "~" ___ "#" varn:NAME _ from:("=" _ v:expression { return v; })? "," _ to:expression ___ "{" _ s:statements _ "}"
{
	return createNode('for', {
		var: varn,
		from: from || createNode('num', { value: 0 }),
		to: to,
		s: s,
	});
}

// general -------------------------------------------------------------------------------

NAME = [A-Za-z] [A-Za-z0-9]* { return text(); }

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
