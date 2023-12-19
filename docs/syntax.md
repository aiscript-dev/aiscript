# Syntax

[Read translated version (en)](../translations/en/docs/syntax.md)

## 文と式
AiScriptにおける構文要素は、コメント等を除き「文(statement)」と「式(expression)」の2つからなります。  
文は行頭または式を受け取る構文要素（ifや関数リテラルなど）にのみ記述することができます。返り値が利用されることを想定されていない構文要素であり、返り値は常にnullです。  
対して式は、文を書ける場所に加えて何らかの値を要求するほとんど全ての構文要素の内部に書くことができます。また、多くの場合何らかの意味ある値を返します。  

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

## 文

### 変数・関数宣言
イミュータブル変数（定数）には`let`、ミュータブル変数には`var`、関数には`@`を使用します。  
#### 予約語について
変数や関数の宣言において、名前として使用できないキーワードがいくつかあります。  
詳しくは[keywords.md](./keywords.md)を参照ください。  
#### 変数
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
#### 関数
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

### 代入
宣言済みの変数の値を変更します。  
```js
var a = 0
a = 1
<: a // 1
```
```js
// letで宣言された変数は代入不可
let a = 0
a = 1 // Runtime Error
```

#### 分割代入
```js
// 配列の分割代入
var a = ''
var b = ''
[a, b] = ['hoge', 'fuga']
<: a // 'hoge'
<: b // 'fuga'
// オブジェクトの分割代入
{ name: a, nature: b } = { name: 'Ai-chan, nature: 'kawaii' }
<: a // 'Ai-chan'
<: b // 'kawaii'
// 組み合わせ
let ai_kun = {
  name: 'Ai-kun',
  nature: ['kakkoii', 'kawaii', 'ponkotsu'],
}
{ name: a, nature: [b] } = ai_kun
<: a // 'Ai-kun'
<: b // 'kakkoii'
```
```js
// 代入値が分割できる型でなければエラー
[a, b] = 1 // Runtime Error
{ zero: a, one: b } = ['hoge', 'fuga'] // Runtime Error
```

### for
与えられた回数のループを行います。  
```js
let repeat = 5
for repeat print('Wan') // WanWanWanWanWan
// {}を使うことで複数の文を書ける
for 2 + 3 {
	<: 'Nyan'
} // NyanNyanNyanNyanNyan
// ()でくくってもよい
for ({ a: 3 }.a) {
  <: 'Piyo'
} // PiyoPiyoPiyo
```
```js
// {の直前に空白必須
for 5{ // Syntax Error
	<: 'Mogu'
}
```
#### for-let
イテレータ変数を宣言し、ループ内で参照することができます。  
```js
for let i, 5 {
	<: i
} // 0 1 2 3 4
// 初期値を設定することもできる
for let i = 3, 5 {
	<: i
} // 3 4 5 6 7
```
```js
// イテレータ変数はletで宣言される必要がある
for var i, 5 {
	<: i
} // Syntax Error
```

### each
配列の各要素に対しループを行います。  
```js
let arr = ['foo', 'bar', 'baz']
each let v, arr {
	<: v
} // foo bar baz
```
```js
// {の直前に空白必須
each let v, arr{ // Syntax Error
	<: v
}
```

### loop
`break`されるまで無制限にループを行います。  
```js
var i = 5
loop {
	<: i
	i -= 1
	if i == 0 break
} // 5 4 3 2 1
```

## グローバル専用文
他の構文要素の内部に書くことを許容されない特殊な文です。  
これらの構文要素は実行開始時に巻き上げられるため、プログラム上のどこに書いても最初に読み込まれます。  

### メタデータ構文
オブジェクトリテラルと類似した記法でAiScriptファイルにメタデータを埋め込める機能です。  
メタデータはホストプログラムによって読まれる場合があります。  
要素として関数を除く純粋な[リテラル](./literals.md)のみが許可されており、それ以外の式を含むと構文エラーとなります。  
```js
### {
	name: "example"
	version: 42
	keywords: ["foo", "bar", "baz"]
}
```

### 名前空間
複数の定数・関数に共通した接頭辞をつけることのできる機能です。  
ミュータブルな変数の存在は許容されていません。  
未発達な機能であり、今後役割が大きく変更される可能性があります。  
```js
:: Ai {
	let chan = 'kawaii'
	@kun() {
		<: chan
	}
}
<: Ai:chan // kawaii
Ai:kun() // kawaii
```

## 式

### リテラル
値をスクリプト中に直接書き込むことができる構文です。  
詳しくは→[literals.md](./literals.md)  

### if
キーワード`if`に続く式がtrueに評価されるかfalseに評価されるかで条件分岐を行います。  
式として扱うことができ、最後の文の値を返します。
`if`の直後に１つ以上の空白またはタブを挟む必要があります。（改行があっても）  
条件式が`bool`型ではない値に評価されるとエラーになります。  
```js
// 単行
if answer == 42 print("correct answer")
// 複数行
if answer == 42 {
	<: "correct answer"
}
// 条件式は()で囲ってもよい
if ({ a: true }.a) print('ok')
// 式として使用可能
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
// 条件式の前後の空白は必須（かっこでくくっていても）
if(true) return 1 // Syntax Error
if (true)return 1 // Syntax Error
// elif, elseの直前の空白は必須
if (false) {
}elif (true) { // Syntax Error
}else {} // Syntax Error
```

### eval
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

### match
```js
let x = 1
let y = match x {
	1 => "yes"
	0 => "no"
	* => "other"
}
<: y // "yes"
```

### exists
与えられた名称の変数または関数が存在すればtrue、しなければfalseを返します。
```js
// 変数barは存在しないためfalse
var foo = exists bar
// 変数fooが存在するためtrue
var bar = exists foo
```
