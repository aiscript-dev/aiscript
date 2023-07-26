[Read translated version (en)](./translations/en/CHANGELOG.md)

- 名前空間内の変数を変更しても、名前空間の外から参照した場合に変更された値を参照できるように
- `Core:to_str`, `テンプレート文字列` でどの値でも文字列へ変換できるように

# 0.15.0
- Mathを強化
- `&&`, `||` 演算子の項が正しく変換されない可能性のあるバグを修正

# 0.14.1

- `&&`, `||` が短絡評価されないバグを修正
- `+=`, `-=` 演算子で関係のない変数が上書きされる可能性のあるバグを修正

# 0.14.0

- オブジェクトの値を配列化する`Obj:vals`を追加
- 文字列が`Json:parse`でパース可能であるかを判定する関数`Json:parsable`を追加
- or/andの結果が第一引数で確定する時、第二引数を評価しないように
- Fix immediate value check in Async:interval

# 0.13.3
- 乱数を生成するとき引数の最大値を戻り値に含むように

# 0.13.2
- `Date:year`,`Date:month`,`Date:day`,`Date:hour`,`Date:minute`,`Date:second`に時間数値の引数を渡して時刻指定可能に
- array.sortとString用比較関数Str:lt, Str:gtの追加
- 乱数を生成するとき引数の最大値を戻り値に含むように

# 0.13.1
- Json:stringifyに関数を渡すと不正な値が生成されるのを修正

# 0.13.0
- 配列プロパティ`map`,`filter`,`reduce`,`find`に渡すコールバック関数が受け取るインデックスを0始まりに
- `@Math:ceil(x: num): num` を追加
- 冪乗の `Core:pow` とその糖衣構文 `^`
- 少数のパースを修正

# 0.12.4
- block comment `/* ... */`
- Math:Infinity

# 0.12.3
- each文の中でbreakとreturnが動作しない問題を修正
- 配列の境界外にアクセスした際にIndexOutOfRangeエラーを発生させるように

# 0.12.2
- 否定構文`!`
- インタプリタ処理速度の調整

# 0.12.1
- 文字列をシングルクォートでも定義可能に
- for文、loop文の中でreturnが動作しない問題を修正
- 無限ループ時にランタイムがフリーズしないように

# 0.12.0
## Breaking changes
- 変数定義の`#` → `let`
- 変数定義の`$` → `var`
- 代入の`<-` → `=`
- 比較の`=` → `==`
- `&` → `&&`
- `|` → `||`
- `? ~ .? ~ .` → `if ~ elif ~ else`
- `? x { 42 => yes }` → `match x { 42 => true }`
- `yes` `no` → `true` `false`
- `_` → `null`
- `<<` → `return`
- `~` → `for`
- `~~` → `each`
- `+ attributeName attributeValue` → `#[attributeName attributeValue]`
- 真理値の`+`/`-`表記方法を廃止
- for、およびeachは配列を返さなくなりました
- ブロック式は`{ }`→`eval { }`に
- 配列のインデックスは0始まりになりました
- いくつかのstdに含まれるメソッドは、対象の値のプロパティとして利用するようになりました。例:
	- `Str:to_num("123")` -> `"123".to_num()`
	- `Arr:len([1 2 3])` -> `[1 2 3].len`
	- etc

## Features
- `continue`
- `break`
- `loop`

## Fixes
- 空の関数を定義できない問題を修正
- 空のスクリプトが許可されていない問題を修正
- ネームスペース付き変数のインクリメント、デクリメントを修正
- ネームスペース付き変数への代入ができない問題を修正 
