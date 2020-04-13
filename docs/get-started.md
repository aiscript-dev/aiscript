# Getting started
## Introduction
AiScript(あいすくりぷと)は、プログラミング言語です。
このドキュメントでは、既にある程度のプログラミングの知識があることを前提にしています。
したがってAiScriptの構文、仕様などについてだけ書き、プログラミング自体についての説明は省きます。

## Hello, world!
AiScriptでは、次のように書きます:
```
print("Hello, world!")
```

`print( ~ )`は関数呼び出しです。カッコの前に呼び出す関数名を書き、カッコの中に引数を書きます。
引数が複数あるときは`,`で区切って列挙します。
関数についての詳細は後述します。

`"~"`は文字列リテラルです。`"`で囲ったものが文字列になります。

ちなみに、`print( ~ )`には糖衣構文があり、次のようにも書けます:
```
<: "Hello, world!"
```

## コメント
AiScriptのコメントは`//`で始めます。
コメントはプログラムの動作に影響を与えません。

```
// this is a comment
```

## 第一級オブジェクト
<table>
	<tr><th>種類</th><th>型</th><th>リテラル例</th></tr>
	<tr><td>文字列</td><td><code>str</code></td><td><code>"kawaii"</code></td></tr>
	<tr><td>数値</td><td><code>num</code></td><td><code>42</code></td></tr>
	<tr><td>真理値</td><td><code>bool</code></td><td><code>yes</code>/<code>no</code></td></tr>
	<tr><td>配列</td><td><code>arr</code></td><td><code>["ai", "chan", "cute"]</code></td></tr>
	<tr><td>オブジェクト</td><td><code>obj</code></td><td><code>{ foo: "bar"; a: 42; }</code></td></tr>
	<tr><td>null</td><td><code>null</code></td><td><code>_</code></td></tr>
	<tr><td>関数</td><td><code>fn</code></td><td><code>@(x) { x }</code></td></tr>
</table>

### 配列
インデックスは1始まりです。

## 変数
### 宣言
変数宣言は次のように書きます:
```
#message = "Hello"
```

`#`のあとに変数名を書き、`=`の後に値を書きます。

AiScriptではこの方法で宣言した変数はイミュータブルです。つまり、変数の値を後から変えることは出来ません。
再代入可能な変数を作る時は、`#`の代わりに`$`で変数宣言します。また、代入には`<-`を使います。例:
```
// ミュータブルな変数を宣言
$message <- "Hello"

// 再代入
message <- "Hi"

// また再代入
message <- "Yo"
```

### 参照
変数の値を参照する時は、単に変数名を書きます:
```
print(message)
```

## 演算
演算は、
```
(1 + 1)
```
のように書きます。これは関数呼び出しの糖衣構文で、実際にはこのように解釈されます:
```
Core:add(1, 1)
```

下記で列挙する関数はすべて`(1 + 1)`のような糖衣構文として使えます。
注意点として、`(1 + 1 + 1)`のようには書けず、`(1 + (1 + 1))`のように入れ子にして使います。

<table>
	<tr><th>関数</th><th>演算子</th><th>意味</th></tr>
	<tr><td><code>Core:add</code></td><td><code>+</code></td><td>加算</td></tr>
	<tr><td><code>Core:sub</code></td><td><code>-</code></td><td>減算</td></tr>
	<tr><td><code>Core:mul</code></td><td><code>*</code></td><td>乗算</td></tr>
	<tr><td><code>Core:div</code></td><td><code>/</code></td><td>除算</td></tr>
	<tr><td><code>Core:mod</code></td><td><code>%</code></td><td>剰余</td></tr>
	<tr><td><code>Core:eq</code></td><td><code>=</code></td><td>等しい</td></tr>
	<tr><td><code>Core:and</code></td><td><code>&</code></td><td>かつ</td></tr>
	<tr><td><code>Core:or</code></td><td><code>|</code></td><td>または</td></tr>
	<tr><td><code>Core:gt</code></td><td><code>></code></td><td>大きい</td></tr>
	<tr><td><code>Core:lt</code></td><td><code><</code></td><td>小さい</td></tr>
</table>

## ブロック
ブロックは処理のまとまりで、`{ ~ }`のように書きます。
ブロックの最後に書かれた式が、ブロックの値として返されます。
```
#foo = {
	#a = 1
	#b = 2
	(a + b)
}

<: foo // 3
```

## 条件分岐
AiScriptでの条件分岐は、次のように書きます:
```
? (a = b) {
	<: "a is equal to b"
}
```

`?`の後にboolを返す式(条件)を書き、その後のブロックで条件に一致した場合の処理を書きます。
同時に、ブロックの後に`...`を書き、さらにブロックを追加することで条件に一致しなかった場合の処理も行うことが出来ます:
```
? (a = b) {
	<: "a is equal to b"
} ... {
	<: "a is not equal to b"
}
```

`...?`の後に条件式を書くことで条件判定を複数行うことも出来ます:
```
? (a = b) {
	<: "a is equal to b"
} ...? (a > b) {
	<: "a is grater than b"
} ... {
	<: "a is less than b"
}
```

これらの条件分岐は式なので、ブロック内で値を返せます:
```
<: ? (a = b) {
	"a is equal to b"
} ...? (a > b) {
	"a is grater than b"
} ... {
	"a is less than b"
}
```

## 繰り返し
AiScriptでの繰り返しは、次のように書きます:
```
~ #i, 100 {
	<: i
}
```
`~`の後にイテレータ変数名を書き、`,`の後に繰り返し回数を返す式を書きます。その後のブロックで繰り返す処理を書きます。

## 関数
### 関数定義
次のように書きます:
```
@fn(x) {
	(x * 2)
}
```

`@`の後に関数名を書き、カッコの中に引数定義を書きます。その後にブロックが関数の処理になります。

### return
関数の最後に書かれた式の値が関数の返り値になりますが、関数の途中で値を返したい時は`<<`を使います。
