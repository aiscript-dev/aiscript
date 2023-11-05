# Syntax

[Read translated version (en)](../translations/en/docs/syntax.md)

## コメント
`//`で始めた行や`/*` `*/`で囲んだ箇所はコメントになり、プログラムの動作に影響を与えません。

```js
// this is a comment
/*
   this is a comment too
*/
```

## 変数・関数宣言
イミュータブル変数（定数）には`let`、ミュータブル変数には`var`、関数には`@`を使用します。  
### 予約語について
変数や関数の宣言において、名前として使用できないキーワードがいくつかあります。  
詳しくは[keywords.md](./keywords.md)を参照ください。  
### 変数
```js
// イミュータブル（再代入不可）
let answer = 42
// ミュータブル（再代入可能）
var answer2 = 57
```
```js
// 初期値の省略は不可
var answer // Syntax Error
// match等の予約語は変数名として使用できない
let match = 12 // Syntax Error
```
### 関数
```js
// 最後の式が暗黙にreturnされる
@add(x, y) {
	x + y
}
<: add(1, 2) // 3
// 明示的にreturnを書くこともできる
@add2(x, y) {
	return x + y
}
<: add(1, 2) // 3
// 引数を複数行で書いてもよい
@add3(
	x,
	y
) {
	x + y
}
@add4(x,y){x+y} // ワンライナー
// 無名関数は式として使用可能
let add5 = @(x, y) {
	x + y
}
```
```js
// match等の予約語は関数名として使用できない
@match(x, y){ // Syntax Error
  x == y
}
// 最後の引数の後にはコロンを付けられない
@add(x, y,) { // Syntax Error
	x + y
}
```

## if
```js
// 単行
if answer == 42 print("correct answer")
// 複数行
if answer == 42 {
	<: "correct answer"
}
// 式として使用可能（
<: `{if answer == 42 "collect answer"}`
// else, elifも使用可能
let result = if answer == "bebeyo" {
	"correct answer"
} elif answer == "ai" {
	"kawaii"
} else {
	"wrong answer"
}
// elseがない場合、条件式がfalseならnullを返す
<: if false 1 // null
```
```js
// ifの直後の空白は必須
if(true) return 1// Syntax Error
```

## for
```js
for let i, 10 {
	<: i
}
```

## Block
```js
let foo = eval {
	let x = 1
	let y = 2
	x + y
}

<: foo // 3
```

## match
```js
let x = 1
let y = match x {
	1 => "yes"
	0 => "no"
	* => "other"
}
<: y // "yes"
```

## exists
```js
let foo = exists bar
let bar = exists foo

<: foo //false
<: bar //true
```
