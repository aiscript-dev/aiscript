{
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
	= _ content:statements? _
{ return content; }

statements
	= head:statement tails:(___ s:statement { return s; })*
{ return [head, ...tails]; }

statement
	= varDefinition
	/ if
	/ return
	/ fnDefinition
	/ fnCall

expression
	= numberLiteral
	/ stringLiteral
	/ booleanLiteral
	/ fnObject
	/ fnCall
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
{ return createNode('number', { value: parseInt(text(), 10) }); }
	/ [+-]? [0-9]
{ return createNode('number', { value: parseInt(text(), 10) }); }

// string literal
stringLiteral
	= "\"" vlaue:$(!"\"" .)* "\""
{ return createNode('string', { vlaue }); }

// boolean literal
booleanLiteral
	= "true"
{ return createNode('bool', { value: true }); }
	/ "false"
{ return createNode('bool', { value: false }); }

// function ------------------------------------------------------------------------------

fn_args
	= head:NAME tails:(_ "," _ name:NAME { return name; })*
{ return [head, ...tails]; }

// statement of function definition
fnDefinition
	= "@" __ name:NAME __ "(" _ args:fn_args? _ ")" _ "{" _ content:statements? _ "}"
{
	return createNode('def', {
		name: name,
		expr: createNode('func', { args }, content)
	});
}

// function object
fnObject = "@" _ "(" _ args:fn_args? _ ")" _ "{" _ content:statements? _ "}"
{ return createNode('func', { args }, content); }

// function call
fnCall
	= name:NAME _ "(" _ args:fnCall_args? _ ")"
{ return createNode('call', { name, args }); }

fnCall_args
	= head:expression tails:(_ "," _ expr:expression { return expr; })*
{ return [head, ...tails]; }

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

// general -------------------------------------------------------------------------------

NAME = [A-Za-z] [A-Za-z0-9]* { return text(); }

// optional spacing
_
	= [ \t\r\n]*

// optional spacing (no linebreaks)
__
	= [ \t]*

// required spacing
___
	= [ \t\r\n]+
