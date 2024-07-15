[Read translated version (en)](./translations/en/CHANGELOG.md)

# 0.19.0

- `Date:year`系の関数に0を渡すと現在時刻になる問題を修正
- シンタックスエラーなどの位置情報を修正
- `arr.reduce`が空配列に対して初期値なしで呼び出された時、正式にエラーを出すよう
- `str.pad_start`,`str.pad_end`を追加
- `arr.insert`,`arr.remove`を追加
- `arr.sort`の処理を非同期的にして高速化
- `arr.flat`,`arr.flat_map`を追加
- `Uri:encode_full`, `Uri:encode_component`, `Uri:decode_full`, `Uri:decode_component`を追加
- `str.starts_with`,`str.ends_with`を追加
- `arr.splice`を追加
- `arr.at`を追加
- For Hosts: エラーハンドラ使用時、InterpreterのオプションでabortOnErrorをtrueにした時のみ全体のabortを行うように

# 0.18.0
- `Core:abort`でプログラムを緊急停止できるように
- `index_of`の配列版を追加
- `str.index_of` `arr.index_of`共に第２引数fromIndexを受け付けるように
- `arr.incl`の引数の型制限を廃止
- `Date:millisecond`を追加
- `arr.fill`, `arr.repeat`, `Arr:create`を追加
- JavaScriptのように分割代入ができるように（現段階では機能は最小限）
- スコープおよび名前が同一である変数が宣言された際のエラーメッセージを修正
- ネストされた名前空間下の変数を参照できるように
- `arr.every`, `arr.some`を追加
- `Date:to_iso_str`を追加

# 0.17.0
- `package.json`を修正
- `Error:create`関数でエラー型の値を生成できるように
- `Obj:merge`で２つのオブジェクトの併合を得られるように
- Fix: チェイン系（インデックスアクセス`[]`、プロパティアクセス`.`、関数呼び出し`()`）と括弧を組み合わせた時に不正な挙動をするバグを修正
- 関数`Str#charcode_at` `Str#to_arr` `Str#to_char_arr` `Str#to_charcode_arr` `Str#to_utf8_byte_arr` `Str#to_unicode_codepoint_arr` `Str:from_unicode_codepoints` `Str:from_utf8_bytes`を追加
- Fix: `Str#codepoint_at`がサロゲートペアに対応していないのを修正
- 配列の範囲外および非整数のインデックスへの代入でエラーを出すように
## Note
バージョン0.16.0に記録漏れがありました。
>- 関数`Str:from_codepoint` `Str#codepoint_at`を追加

# 0.16.0
- **ネームスペースのトップレベルに`var`は定義できなくなりました。(`let`は可能)**
- `Core:to_str`, `テンプレート文字列` でどの値でも文字列へ変換できるように
- 指定時間待機する関数`Core:sleep`を追加
- `exists 変数名` の構文で変数が存在するか判定できるように
- オブジェクトを添字で参照できるように（`object['index']`のように）
- 「エラー型（`error`）」を導入
- `Json:parse`がパース失敗時にエラー型の値を返すように
- `let` で定義した変数が上書きできてしまうのを修正
- 関数`Str:from_codepoint` `Str#codepoint_at`を追加

## For Hosts
- **Breaking Change** AiScriptErrorのサブクラス４種にAiScript-の接頭辞を追加（例：SyntaxError→AiScriptSyntaxError）
- Interpreterのコンストラクタの第２引数の要素に`err`（エラーコールバック）を設定できる。これは`Interpreter.exec`が失敗した時に加えて、**`Async:interval`や`Async:timeout`が失敗した場合にも呼び出される。** なお、これを設定した場合は例外throwは発生しなくなる。
- ネイティブ関数は`opts.call`の代わりに`opts.topCall`を用いることで上記２つのようにエラーコールバックが呼び出されるように。**必要な場合にのみ使うこと。従来エラーキャッチ出来ていたケースでは引き続き`opts.call`を使う。**

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
