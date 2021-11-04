# Getting started
## Introduction
AiScript is a programming language.
This document assumes that you already have some programming knowledge.
Therefore, I will only write about the syntax and specifications of AiScript, and leave out the description of programming itself.

## Hello, world!
In AiScript, it is written as follows:
```
print("Hello, world!")
```

`print( ~ )` is a function call. The name of the function to be called is written before the parentheses, and the arguments are written inside the parentheses.
If there are multiple arguments, they are listed separated by `,`.
The details of the function are described later.

`"~"` is a string literal. Anything enclosed in `"` is a string.

Incidentally, `print( ~ )` has a sugar-coated syntax and can be written as follows:
```
<: "Hello, world!"
```

## Comments
AiScript comments start with `//`.
Comments do not affect the behavior of the program.

```
// this is a comment
```

## Primary object
<table>
	<tr><th>Type</th><th>Form</th><th>Example of literal</th></tr>
	<tr><td>string</td><td><code>str</code></td><td><code>"kawaii"</code></td></tr>
	<tr><td>numeric</td><td><code>num</code></td><td><code>42</code></td></tr>
	<tr><td>truth-value</td><td><code>bool</code></td><td><code>yes</code>/<code>no</code></td></tr>
	<tr><td>array</td><td><code>arr</code></td><td><code>["ai" "chan" "cute"]</code></td></tr>
	<tr><td>object</td><td><code>obj</code></td><td><code>{ foo: "bar"; a: 42; }</code></td></tr>
	<tr><td>null</td><td><code>null</code></td><td><code>null</code></td></tr>
	<tr><td>function</td><td><code>fn</code></td><td><code>@(x) { x }</code></td></tr>
</table>

## Variables
### Declaration
The variable declaration is written as follows:
```
#message = "Hello"
```

Write the name of the variable after `#` and the value after `=`.

In AiScript, variables declared in this way are immutable. In other words, you cannot change the value of a variable later.
To create a variable that can be reassigned, declare the variable with `$` instead of `#`. Also, use `<-` for assignments. Example:
```
// Declare a mutable variable.
$message <- "Hello"

// reassignment
message <- "Hi"

// Reassigning again
message <- "Yo"
```

### Reference
When referring to the value of a variable, simply write the name of the variable:
```
print(message)
```

## Array
Enumerate expressions in an array `[]`, separated by spaces.
```
["ai" "chan" "kawaii"]
```

To access an element of an array, write `[<index>]`. The index starts at 1.
```
#arr = ["ai" "chan" "kawaii"]
<: arr[1] // "ai"
```

## Object
```
{
	foo: "bar"
	answer: 42
	nested: {
		some: "thing"
	}
}
```

## Arithmetic operation
The operation is
```
(1 + 1)
```
This is a sugar-coated syntax for function calls. This is the sugar-coated syntax for function calls, and is actually interpreted as such:
```
Core:add(1, 1)
```

All of the functions listed below can be used as sugar-coated syntax such as `(1 + 1)`.
Note that it cannot be written as `(1 + 1 + 1)`, but must be nested as `(1 + (1 + 1))`.

<table>
	<tr><th>Function</th><th>Operator</th><th>Meaning</th></tr>
	<tr><td><code>Core:add</code></td><td><code>+</code></td><td>addition</td></tr>
	<tr><td><code>Core:sub</code></td><td><code>-</code></td><td>subtraction</td></tr>
	<tr><td><code>Core:mul</code></td><td><code>*</code></td><td>multiplication</td></tr>
	<tr><td><code>Core:div</code></td><td><code>/</code></td><td>division</td></tr>
	<tr><td><code>Core:mod</code></td><td><code>%</code></td><td>remainder</td></tr>
	<tr><td><code>Core:eq</code></td><td><code>=</code></td><td>equal</td></tr>
	<tr><td><code>Core:and</code></td><td><code>&</code></td><td>and</td></tr>
	<tr><td><code>Core:or</code></td><td><code>|</code></td><td>or</td></tr>
	<tr><td><code>Core:gt</code></td><td><code>></code></td><td>greater than</td></tr>
	<tr><td><code>Core:lt</code></td><td><code><</code></td><td>less than</td></tr>
</table>

## Block
A block is a collection of processes, written as `{ ~ }`.
The expression written at the end of the block will be returned as the value of the block.
```
#foo = {
	#a = 1
	#b = 2
	(a + b)
}

<: foo // 3
```

The block itself is also a formula.

## Conditional branching
The conditional branch in AiScript is written as follows:
```
if (a = b) {
	<: "a is equal to b"
}
```

After `if`, write an expression (condition) that returns a bool, followed by an expression (then clause) that will be evaluated if the condition is met.
You can add `else` after the `then' clause and add an expression to handle the case when the condition is not met:
```
if (a = b) {
	<: "a is equal to b"
} else {
	<: "a is not equal to b"
}
```

You can also write conditional expressions after `elif` to make multiple conditional decisions:
```
if (a = b) {
	<: "a is equal to b"
} elif (a > b) {
	<: "a is grater than b"
} else {
	<: "a is less than b"
}
```

Since these conditional branches are expressions, they can return a value in the block:
```
<: if (a = b) {
	"a is equal to b"
} elif (a > b) {
	"a is grater than b"
} else {
	"a is less than b"
}
```

## Loop
To iterate in AiScript, write the following:
```
for (#i, 100) {
	<: i
}
```
After `for`, write the name of the iterator variable, and after `,` write an expression that returns the number of iterations. Write the process to be repeated in the block that follows.
The iterator variable can also be omitted:
```
for (100) {
	<: "yo"
}
```

## Loop (array)
You can use `each` to repeat items in an array:
```
#items = ["a" "b" "c"]
each (#item, items) {
	<: item
}
```

## Function
### Function definition
Write the following:
```
@fn(x) {
	(x * 2)
}
```

Write the function name after `@` and the argument definition in parentheses. After that, the block becomes the process of the function.

### return
The value of the expression written at the end of the function will be the return value of the function, but if you want to return a value in the middle of the function, use `return`.

## Template
You can embed variables and expressions in a string:
```
#ai = "kawaii"
<: `Hello, {ai} world!`
```

## Metadata
This function allows you to embed metadata in AiScript files.
```
### {
	name: "example"
	version: 42
	keywords: ["foo" "bar" "baz"]
}
```
# Examples
## FizzBuzz
```
for (#i, 100) {
	<: ? ((i % 15) = 0) "FizzBuzz"
		.? ((i % 3) = 0) "Fizz"
		.? ((i % 5) = 0) "Buzz"
		. i
}
```
