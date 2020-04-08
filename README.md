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
		<td>`.moe`</td>
	</tr>
	<tr>
		<th>Influenced by</th>
		<td>JavaScript, Rust</td>
	</tr>
</table>

## How to run your AiScript
※まず最初に`npm run build`しておいてください

1. `test.moe`という名前のファイルをこのリポジトリのルートディレクトリに作成する
2. スクリプトをそのファイルに書く
3. `npm start`すると実行されます

## Syntax
### 変数宣言
```
#<variable name> = <value>
```

ex:
```
#answer = 42
```

### if
```
? <condition> {
	<statements>
}
```

with elseif
```
? <condition> {
	<statements>
} ...? <condition> {
	<statements>
}
```

with else
```
? <condition> {
	<statements>
} ... {
	<statements>
}
```

ex:
```
? eq(answer, 42) {
	print("correct answer")
} ... {
	print("wrong answer")
}
```

## std
### @print(message: string): void
画面に文字列を表示します。

## Example programs
### Hello world
```
print("Hello, world!")
```

### Fizz Buzz
```
coming soon
```
