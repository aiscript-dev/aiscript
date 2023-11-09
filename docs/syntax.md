# Syntax

[Read translated version (en)](../translations/en/docs/syntax.md)

## コメント
`//`で始めた行や`/*` `*/`で囲んだ箇所はコメントになり、プログラムの動作に影響を与えません。

```js
// 単行コメント
/*
   複数行コメント
*/
```

## バージョン表記
プログラムの一行目に以下の記法を行うことで、想定されたAiScriptのバージョンを明記することができます。  
このバージョンはホストプログラムによって読み込まれる場合があります。  
```js
/// @ 0.16.0
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
// 同名の変数の再宣言は禁止
var a = 1
var a = 2 // Runtime Error
let a = 3 // Runtime Error
```
### 関数
関数宣言はイミュータブル変数を関数で初期化するのと同じ動作になっています。  
```js
// 最後の式が暗黙にreturnされる
@add(x, y) {
	x + y
}
<: add(1, 2) // 3
// 定数をリテラル関数で初期化しても同じ働きになる
let add2 = @(x, y) {
	x + y
}
// 明示的にreturnを書くこともできる
@add3(x, y) {
	return x + y
}
// 引数を複数行で書いてもよい
@add4(
	x,
	y
) {
	x + y
}
@add5(x,y){x+y} // ワンライナー
```
```js
// match等の予約語は関数名として使用できない
@match(x, y) { // Syntax Error
  x == y
}
// 最後の引数の後にはコロンを付けられない
@add(x, y,) { // Syntax Error
	x + y
}
// 変数同様再宣言は不可
var func = null
@func() { // Runtime Error
  'hoge'
}
```

## if
キーワード`if`に続く式がtrueに評価されるかfalseに評価されるかで条件分岐を行います。  
`if`の直後に１つ以上の空白またはタブを挟む必要があります。（改行があっても）  
`bool`型ではない値に評価されるとエラーになります。  
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

## each
```
let arr = ['chan', 'kun', 'sama']
each let v, arr {
	<: v
}
```

## eval
別名ブロック式。
`{ }`内の文を順次評価し、最後の文の値を返します。
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
与えられた名称の変数または関数が存在すればtrue、しなければfalseを返します。
```js
// 変数barは存在しないためfalse
var foo = exists bar
// 変数fooが存在するためtrue
var bar = exists foo
```

## テンプレート構文
変数や式を埋め込んだ文字列を作成するための構文です。  
全体を`` ` ` ``で囲い、式を埋め込む場所は`{ }`で囲います。  
```
let ai = "kawaii"
<: `Hello, {ai} world!`
// 結果: Hello, kawaii world!
```

## メタデータ
AiScriptファイルにメタデータを埋め込める機能です。  
メタデータはホストプログラムによって読まれる場合があります。  
```
### {
	name: "example"
	version: 42
	keywords: ["foo" "bar" "baz"]
}
```
