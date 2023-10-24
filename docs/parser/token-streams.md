# TokenStreams
各種パース関数はITokenStreamインターフェースを実装したクラスインスタンスを引数にとる。

実装クラス
- Scanner
- TokenStream

## TokenStream
読み取り済みのトークン列を入力にとるストリーム。
テンプレート構文では式部分の読み取りだけを先に行い、内容の解析はパース時に行われる。
この際の読み取り済みのトークン列はTokenStremによりパース関数に渡される。
