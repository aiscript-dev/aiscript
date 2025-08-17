[Read translated version (en)](./translations/en/CHANGELOG.md)

# 1.1.0

- オブジェクトリテラルのプロパティ名に予約語を直接記述できるようになりました。
- Fix: `Math:gen_rng`のアルゴリズム`chacha20`および`rc4`が非セキュアコンテクスト下では動作しないため、そのような環境下では`options.algorithm`のデフォルトを`rc4_legacy`に変更

# 1.0.0

- 新しいAiScriptパーサーを実装
  - スペースの厳密さが緩和
  - **Breaking Change** 改行トークンを導入。改行の扱いが今までより厳密になりました。改行することができる部分以外では文法エラーになります。
- 文字列リテラルやテンプレートで、`\`とそれに続く1文字は全てエスケープシーケンスとして扱われるように
- 文法エラーの表示を改善。理由を詳細に表示するように。
- 複数行のコメントがある時に文法エラーの表示行数がずれる問題を解消しました。
- 実行時エラーの発生位置が表示されるように。
- **Breaking Change** パースの都合によりmatch文の構文を変更。パターンの前に`case`キーワードが必要となり、`*`は`default`に変更。
- **Breaking Change** 多くの予約語を追加。これまで変数名等に使えていた名前に影響が出る可能性があります。
- **Breaking Change** 配列及び関数の引数において、空白区切りが使用できなくなりました。`,`または改行が必要です。
- **Breaking Change** 関数同士の比較の実装
- **Breaking Change** `+`や`!`などの演算子の優先順位に変更があります。新しい順序は[syntax.md](docs/syntax.md#%E6%BC%94%E7%AE%97%E5%AD%90)を参照して下さい。
- **Breaking Change** 組み込み関数`Num:to_hex`は組み込みプロパティ`num#to_hex`に移動しました。
- **Breaking Change** `arr.sort`を安定ソートに変更
- while文とdo-while文を追加
- 省略可能引数と初期値付き引数を追加。引数名に`?`を後置することでその引数は省略可能となります。引数に`=<式>`を後置すると引数に初期値を設定できます。省略可能引数は初期値`null`の引数と同等です。
  - BREAKING: いずれでもない引数が省略されると即時エラーとなるようになりました。
- `Date:parse`がパース失敗時にエラー型の値を返すように
- AiScriptのスクリプトファイルを表す拡張子が`.is`から`.ais`に変更されました。
- ファイル実行機能により読み取られるファイルの名前が`test.is`から`main.ais`へ変更されました。
- 関数`Math:gen_rng`に第二引数`algorithm`をオプション引数として追加。
  - アルゴリズムを`chacha20`、`rc4`、`rc4_legacy`から選べるようになりました。
  - **Breaking Change** `algorithm`を指定しない場合、`chacha20`が選択されます。
- Fix: **Breaking Change** `Math:rnd`が範囲外の値を返す可能性があるのをアルゴリズムの変更により修正。
- Breaking For Hosts: 曖昧な型を変更しました。（TypeScriptの型のみの変更であり、JavaScriptの値としては変更はありません）
  - `Interpreter`のオプションのlog関数の引数の型
  - `AiScriptError`のinfoの型
  - `Interpreter.collectMetadata`、`valToJs`の戻り値の型
  - `Node`型で存在しないプロパティーの削除
- 関数`Core:pow`、`Core:div`、`Math:sqrt`が例外を発生する問題を修正。
  - `0 / 0`、`-1 ^ 0.5`、`Math:sqrt(-1)`が`NaN`を返すようになります。
  - `NaN`は`v != v`により検出できます。
- 変数宣言（each文での宣言を含む）と関数の仮引数で分割代入ができるように（名前空間内では分割代入を使用した宣言はできません。）
- For Hosts: Interpreterのオプションに`irqRate`と`irqSleep`を追加
  - `irqRate`はInterpreterの定期休止が何ステップに一回起こるかを指定する数値
  - `irqSleep`は休止時間をミリ秒で指定する数値、または休止ごとにawaitされるPromiseを返す関数
- **Breaking Change** match式において、case節とdefault節の間に区切り文字が必須になりました。case節の後にdefault節を区切り文字なしで続けると文法エラーになります。
- **Breaking Change** if式やmatch式、for文の内容が1つの文である場合にもスコープが生成されるようになりました。これらの構文内で定義された変数は外部から参照できなくなります。
- ランタイムエラーにコールスタックの情報を追加。
- For Hosts: いくつかの型で args を params にリネームしました。
- 複数の改行が1つの改行と同等に扱われるようになりました。次に示す部分で複数の改行を挿入できます。
  - 空のmatch式の波括弧内および、match式の各case節やdefault節の前後
  - 引数のない関数呼び出しの丸括弧内および、関数呼び出しの各引数の前後
  - 引数のない関数定義の丸括弧内および、関数定義の各引数の前後
  - if式において、then節やelif節、else節の間
  - 単項演算や二項演算において、バックスラッシュの後
  - 変数定義において、等号と式の間
  - 属性と文の間
- テンプレートリテラルに波括弧を含む式を埋め込むことができるようになりました。
- **Breaking Change** 複合代入文(`+=`, `-=`)の左辺が1回だけ評価されるようになりました。
- For Hosts: `interpreter.pause()`で実行の一時停止ができるように
  - `interpreter.unpause()`で再開
  - 再開後に`Async:`系の待ち時間がリセットされる不具合がありますが、修正の目処は立っていません
- テンプレートリテラル内に埋め込まれた式の先頭および末尾の改行が許容されるようになりました。
- 単項演算子の正号 `+`・負号 `-`が数値リテラル以外の式にも使用できるようになりました。
- 以下の型注釈ができるようになりました。
  - 関数宣言および関数型でのジェネリクス
  - ユニオン型
  - error型
  - never型
- 関数`Obj:pick`を追加
- オブジェクトリテラルのキーに文字列リテラルを記述できるようになりました。
- return文、break文、continue文の挙動が変更されました。
  - Fix: eval式やif式内でreturn文あるいはbreak文、continue文を使用すると不正な値が取り出せる不具合を修正しました。
  - return文は関数スコープ内でないと文法エラーになります。
  - ラベルが省略されたbreak文およびcontinue文は反復処理文(for, each, while, do-while, loop)のスコープ内でないと文法エラーになります。
  - return文は常に関数から脱出します。
  - ラベルが省略されたbreak文は必ず最も内側の反復処理文の処理を中断し、ループから脱出します。
  - continue文は必ず最も内側の反復処理文の処理を中断し、ループの先頭に戻ります。
  - eval, if, match, loop, while, do-while, for, eachにラベルを付けてbreak文やcontinue文で指定したブロックから脱出できるようになります。eval, if, matchから脱出するbreak文には値を指定することができます。
- 名前空間下の変数定義に属性を付与できるようになりました。
- sync版メソッドを使用して同期的に実行できるようになりました。
- For Hosts: AiScriptのオブジェクトの表記法を利用したデータ交換用フォーマット「AiScript Object Notation (AiSON)」およびそのパーサーを追加しました。
	- 現在、`AiSON.parse()`（パースしてJavaScriptオブジェクトに変換する）が使用できます。
	- 通常のAiScriptと異なるのは以下の点です：
		- リテラルはトップレベルにひとつだけしか許可されません。
		- 動的な式（関数・オブジェクトのvalueに対する動的なバインディングなど）は許可されません。
		- 名前空間・メタデータなど、リテラルとコメント以外をトップレベルに書くことは許可されていません。

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
