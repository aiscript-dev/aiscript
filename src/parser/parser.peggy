{
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
}

//
// preprocessor
//

Preprocess
	= s:PreprocessPart*
{ return s.join(''); }

PreprocessPart
	= Tmpl { return text(); }
	/ Str { return text(); }
	/ Comment
	/ .

Comment
	= "//" (!EOL .)* { return ''; }
	/ "/*" (!"*/" .)* "*/" { return ''; }


//
// main parser
//

Main
	= _* content:GlobalStatements? _*
{ return content ?? []; }

GlobalStatements
	= head:GlobalStatement tails:(__* LF _* s:GlobalStatement { return s; })*
{ return [head, ...tails]; }

NamespaceStatements
	= head:NamespaceStatement tails:(__* LF _* s:NamespaceStatement { return s; })*
{ return [head, ...tails]; }

Statements
	= head:Statement tails:(__* LF _* s:Statement { return s; })*
{ return [head, ...tails]; }

// list of global statements

GlobalStatement
	= Namespace // "::"
	/ Meta      // "###"
	/ Statement

// list of namespace statement

NamespaceStatement
	= VarDef
	/ FnDef
	/ Namespace

// list of statement

Statement
	= VarDef      // "let" NAME | "var" NAME
	/ FnDef       // "@"
	/ Out         // "<:"
	/ Return      // "return"
	/ Attr        // "+"
	/ Each        // "each"
	/ For         // "for"
	/ Loop        // "loop"
	/ Break       // "break"
	/ Continue    // "continue"
	/ Assign      // Expr "=" | Expr "+=" | Expr "-="
	/ Expr

// list of expression

Expr
	= Infix
	/ Expr2

Expr2
	= If          // "if"
	/ Fn          // "@("
	/ Chain       // Expr3 "(" | Expr3 "[" | Expr3 "."
	/ Expr3

Expr3
	= Match       // "match"
	/ Eval        // "eval"
	/ Exists      // "exists"
	/ Tmpl        // "`"
	/ Str         // "\""
	/ Num         // "+" | "-" | "1"~"9"
	/ Bool        // "true" | "false"
	/ Null        // "null"
	/ Obj         // "{"
	/ Arr         // "["
	/ Not         // "!"
	/ Identifier  // NAME_WITH_NAMESPACE
	/ "(" _* e:Expr _* ")" { return e; }

// list of static literal

StaticLiteral
	= Num         // "+" "1"~"9" | "-" "1"~"9" | "1"~"9"
	/ Str         // "\""
	/ Bool        // "true" | "false"
	/ StaticArr   // "["
	/ StaticObj   // "{"
	/ Null        // "null"



//
// global statements ---------------------------------------------------------------------
//

// namespace statement

Namespace
	= "::" _+ name:NAME _+ "{" _* members:NamespaceStatements? _* "}"
{ return createNode('ns', { name, members }); }

// meta statement

Meta
	= "###" __* name:NAME _* value:StaticLiteral
{ return createNode('meta', { name, value }); }
	/ "###" __* value:StaticLiteral
{ return createNode('meta', { name: null, value }); }



//
// statements ----------------------------------------------------------------------------
//

// define statement

VarDef
	= "let" _+ name:NAME type:(_* ":" _* @Type)? _* "=" _* expr:Expr
{ return createNode('def', { name, varType: type, expr, mut: false, attr: [] }); }
	/ "var" _+ name:NAME type:(_* ":" _* @Type)? _* "=" _* expr:Expr
{ return createNode('def', { name, varType: type, expr, mut: true, attr: [] }); }

// output statement

// NOTE: out is syntax sugar for print(expr)
Out
	= "<:" _* expr:Expr
{
	return createNode('identifier', {
		name: 'print',
		chain: [createNode('callChain', { args: [expr] })],
	});
}

// attribute statement

// Note: Attribute will be combined with def node when parsing is complete.
Attr
	= "#[" _* name:NAME value:(_* @StaticLiteral)? _* "]"
{
	return createNode('attr', {
		name: name,
		value: value ?? createNode('bool', { value: true })
	});
}

// each statement

Each
	= "each" _* "(" "let" _+ varn:NAME _* ","? _* items:Expr ")" _* x:BlockOrStatement
{
	return createNode('each', {
		var: varn,
		items: items,
		for: x,
	});
}
	/ "each" _+ "let" _+ varn:NAME _* ","? _* items:Expr _+ x:BlockOrStatement
{
	return createNode('each', {
		var: varn,
		items: items,
		for: x,
	});
}

// for statement

For
	= "for" _* "(" "let" _+ varn:NAME _* from_:("=" _* v:Expr { return v; })? ","? _* to:Expr ")" _* x:BlockOrStatement
{
	return createNode('for', {
		var: varn,
		from: from_ ?? createNode('num', { value: 0 }),
		to: to,
		for: x,
	});
}
	/ "for" _+ "let" _+ varn:NAME _* from_:("=" _* v:Expr { return v; })? ","? _* to:Expr _+ x:BlockOrStatement
{
	return createNode('for', {
		var: varn,
		from: from_ ?? createNode('num', { value: 0 }),
		to: to,
		for: x,
	});
}
	/ "for" _* "(" times:Expr ")" _* x:BlockOrStatement
{
	return createNode('for', {
		times: times,
		for: x,
	});
}
	/ "for" _+ times:Expr _+ x:BlockOrStatement
{
	return createNode('for', {
		times: times,
		for: x,
	});
}

// return statement

Return
	= "return" ![A-Z0-9_:]i _* expr:Expr
{ return createNode('return', { expr }); }

// loop statement

Loop
	= "loop" _* "{" _* s:Statements _* "}"
{ return createNode('loop', { statements: s }); }

// break statement

Break
	= "break" ![A-Z0-9_:]i
{ return createNode('break', {}); }

// continue statement

Continue
	= "continue" ![A-Z0-9_:]i
{ return createNode('continue', {}); }

// assign statement

Assign
	= dest:Expr _* op:("+=" / "-=" / "=") _* expr:Expr
{
	if (op === '+=')
		return createNode('addAssign', { dest, expr });
	else if (op === '-=')
		return createNode('subAssign', { dest, expr });
	else
		return createNode('assign', { dest, expr });
}



//
// expressions --------------------------------------------------------------------
//

// infix expression

Infix
	= head:Expr2 tail:(InfixSp* op:Op InfixSp* term:Expr2 { return {op, term}; })+
{
	return createNode('infix', {
		operands: [head, ...tail.map(i => i.term)],
		operators: tail.map(i => i.op.value),
		operatorLocs: tail.map(i => i.op.loc),
	});
}

InfixSp
	= "\\" LF
	/ __

Op
	= ("||" / "&&" / "==" / "!=" / "<=" / ">=" / "<" / ">" / "+" / "-" / "*" / "^" / "/" / "%")
{
	const loc = location();
	return {
		value: text(),
		loc: { start: loc.start.offset, end: loc.end.offset - 1 },
	};
}

Not
	= "!" expr:Expr
{
	return createNode('not', {
		expr: expr,
	});
}


// chain

Chain
	= e:Expr3 chain:(CallChain / IndexChain / PropChain)+
{
	if (e.chain) {
		return { ...e, chain: [...e.chain, ...chain] };
	} else {
		return { ...e, chain };
	}
}

CallChain
	= "(" _* args:CallArgs? _* ")"
{ return createNode('callChain', { args: args ?? [] }); }

CallArgs
	= head:Expr tails:(SEP expr:Expr { return expr; })*
{ return [head, ...tails]; }

IndexChain
	= "[" _* index:Expr _* "]"
{ return createNode('indexChain', { index }); }

PropChain
	= "." name:NAME
{ return createNode('propChain', { name }); }

// if statement

If
	= "if" _+ cond:Expr _+ then:BlockOrStatement elseif:(_+ @ElseifBlocks)? elseBlock:(_+ @ElseBlock)?
{
	return createNode('if', {
		cond: cond,
		then: then,
		elseif: elseif ?? [],
		else: elseBlock
	});
}

ElseifBlocks
	= head:ElseifBlock tails:(_* @ElseifBlock)*
{ return [head, ...tails]; }

ElseifBlock
	= "elif" ![A-Z0-9_:]i _* cond:Expr _* then:BlockOrStatement
{ return { cond, then }; }

ElseBlock
	= "else" ![A-Z0-9_:]i _* then:BlockOrStatement
{ return then; }

// match expression

Match
	= "match" ![A-Z0-9_:]i _* about:Expr _* "{" _* qs:(q:Expr _* "=>" _* a:BlockOrStatement _* { return { q, a }; })+ x:("*" _* "=>" _* @BlockOrStatement _*)? _* "}"
{
	return createNode('match', {
		about: about,
		qs: qs ?? [],
		default: x
	});
}

// eval expression

Eval
	= "eval" _* "{" _* s:Statements _* "}"
{ return createNode('block', { statements: s }); }

// exists expression

Exists
	= "exists" _+ i:Identifier
{ return createNode('exists', { identifier: i }); }

// variable reference expression

Identifier
	= name:NAME_WITH_NAMESPACE
{ return createNode('identifier', { name }); }



//
// literals ------------------------------------------------------------------------------
//

// template literal

Tmpl
	= "`" items:(!"`" @TmplEmbed)* "`"
{ return createNode('tmpl', { tmpl: items }); }

TmplEmbed
	= "{" __* @expr:Expr __* "}"
	/ str:TmplAtom+ {return str.join("")}

TmplAtom
  = TmplEsc
	/ [^`{]

TmplEsc
	= "\\" @[{}`]

// string literal

Str
	= "\"" value:(!"\"" c:(StrDoubleQuoteEsc / .) { return c; })* "\""
{ return createNode('str', { value: value.join('') }); }
	/ "'" value:(!"'" c:(StrSingleQuoteEsc / .) { return c; })* "'"
{ return createNode('str', { value: value.join('') }); }

StrDoubleQuoteEsc
	= "\\\""
{ return '"'; }

StrSingleQuoteEsc
	= "\\\'"
{ return '\''; }

// number literal
Num
	= Float
	/ Int

Float
	= [+-]? [1-9] [0-9]+ "." [0-9]+
	{ return createNode('num', { value: parseFloat(text())}); }
	/ [+-]? [0-9] "." [0-9]+
	{ return createNode('num', { value: parseFloat(text())}); }

Int
	= [+-]? [1-9] [0-9]+
{ return createNode('num', { value: parseInt(text(), 10) }); }
	/ [+-]? [0-9]
{ return createNode('num', { value: parseInt(text(), 10) }); }

// boolean literal

Bool
	= True
	/ False

True
	= "true" ![A-Z0-9_:]i
{ return createNode('bool', { value: true }); }

False
	= "false" ![A-Z0-9_:]i
{ return createNode('bool', { value: false }); }

// null literal

Null
	= "null" ![A-Z0-9_:]i
{ return createNode('null', {}); }

// object literal

Obj
	= "{" _* kvs:(k:NAME _* ":" _+ v:Expr _* ("," / ";")? _* { return { k, v }; })* "}"
{
	const obj = new Map();
	for (const kv of kvs) {
		obj.set(kv.k, kv.v);
	}
	return createNode('obj', { value: obj });
}

// array literal

Arr
	= "[" _* items:(item:Expr _* ","? _* { return item; })* _* "]"
{ return createNode('arr', { value: items }); }



//
// function ------------------------------------------------------------------------------
//

Arg
	= name:NAME type:(_* ":" _* @Type)?
{ return { name, argType: type }; }

Args
	= head:Arg tails:(SEP @Arg)*
{ return [head, ...tails]; }

// define function statement

FnDef
	= "@" s1:__* name:NAME s2:__* "(" _* args:Args? _* ")" ret:(_* ":" _* @Type)? _* "{" _* content:Statements? _* "}"
{
	if (s1.length > 0 || s2.length > 0) {
		error('Cannot use spaces before or after the function name.');
	}
	return createNode('def', {
		name: name,
		expr: createNode('fn', { args: args ?? [], retType: ret }, content ?? []),
		mut: false,
		attr: []
	});
}

// function expression

Fn = "@(" _* args:Args? _* ")" ret:(_* ":" _* @Type)? _* "{" _* content:Statements? _* "}"
{ return createNode('fn', { args: args ?? [], retType: ret }, content ?? []); }



//
// static literal ------------------------------------------------------------------------
//

// array literal (static)

StaticArr
	= "[" _* items:(item:StaticLiteral _* ","? _* { return item; })* _* "]"
{ return createNode('arr', { value: items }); }

// object literal (static)

StaticObj
	= "{" _* kvs:(k:NAME _* ":" _+ v:StaticLiteral _* ("," / ";")? _* { return { k, v }; })* "}"
{
	const obj = new Map();
	for (const kv of kvs) {
		obj.set(kv.k, kv.v);
	}
	return createNode('obj', { value: obj });
}



//
// type ----------------------------------------------------------------------------------
//

Type
	= FnType
	/ NamedType

FnType
	= "@(" _* args:ArgTypes? _* ")" _* "=>" _* result:Type
{ return createNode('fnTypeSource', { args: args ?? [], result }); }

ArgTypes
	= head:Type tails:(SEP @Type)*
{ return [head, ...tails]; }

NamedType
	= name:NAME __* "<" __* inner:Type __* ">"
{ return createNode('namedTypeSource', { name, inner }); }
	/ name:NAME
{ return createNode('namedTypeSource', { name, inner: null }); }



//
// general -------------------------------------------------------------------------------
//

NAME
	= [A-Z_]i [A-Z0-9_]i*
{ return text(); }

NAME_WITH_NAMESPACE
	= NAME (":" NAME)*
{ return text(); }

SEP
	= _* "," _*
	/ _+

BlockOrStatement
	= "{" _* s:Statements? _* "}"
{ return createNode('block', { statements: (s ?? []) }); }
	/ Statement

LF
	= "\r\n" / [\r\n]

EOL
	= !. / LF

// spacing
_
	= [ \t\r\n]

// spacing (no linebreaks)
__
	= [ \t]
