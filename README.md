# AiScript
AiScript is a script language run on JavaScript.
Design of AiScript is inspired by JavaScript and Rust.

<table>
	<tr>
		<th>Paradigm</th>
		<td>Multi-paradigm: event-driven, functional, imperative</td>
	</tr>
	<tr>
		<th>Designed by</th>
		<td>syuilo, mrhc</td>
	</tr>
	<tr>
		<th>First appeared</th>
		<td>2020</td>
	</tr>
	<tr>
		<th>Typing discipline</th>
		<td>Dynamic, duck</td>
	</tr>
	<tr>
		<th>Filename extensions</th>
		<td>`.is`</td>
	</tr>
	<tr>
		<th>Influenced by</th>
		<td>JavaScript, Rust</td>
	</tr>
</table>

## How to use AiScript interpreter
※まず最初に`npm run build`しておいてください

1. ターミナルで`node console`

## How to run your AiScript
※まず最初に`npm run build`しておいてください

1. `test.is`という名前のファイルをこのリポジトリのルートディレクトリに作成する
2. スクリプトをそのファイルに書く
3. `npm start`すると実行されます

## Syntax
[See here](./docs/syntax.md)

## Std library reference
[See here](./docs/std.md)

## Example programs
### Hello world
```
<: "Hello, world!"
```

### Fizz Buzz
```
~ #i, 100 {
	<: ? ((i % 15) = 0) { "FizzBuzz" }
	...? ((i % 3) = 0) { "Fizz" }
	...? ((i % 5) = 0) { "Buzz" }
	... { i }
}
```
