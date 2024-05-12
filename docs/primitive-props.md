[Read translated version (en)](../translations/en/docs/primitive-props.md)

プリミティブプロパティとは、特定の型の値向けに用意された特殊な値あるいは関数です。  
オブジェクトのプロパティのように`.<name>`の記法で呼び出すことができます。（`[<str>]`の記法は使えません）
```js
// 例
'ai kawaii'.len //9

Core:range(0,2).push(4) //[0,1,2,4]
```
今の所、数値・文字列・配列・エラー型に対応するものが用意されています。オブジェクトのそれに相当するものは、記法との兼ね合いで[std関数](std.md#-obj)として実装されています。

## 書式
本ページでは、（型名）型の任意の値に対するプリミティブプロパティを下記のような形式で表記します。
> #(_v_: 型名).プロパティ名  
> // または  
> @(_v_: 型名).プリミティブ関数名(引数リスト): 返り値の型  

\#から始まるものは関数以外の値を持つプリミティブプロパティです。
\@から始まるものは関数のプリミティブプロパティ（プリミティブ関数）です。

## 数値
### @(_x_: num).to_str(): str
数値を文字列に変換します。  


## 文字列
### #(_v_: str).len
型: `num`  
文字列の長さを取得します。  

### @(_v_: str).to_num(): num | null
文字列が数字であれば、数値に変換します。  

### @(_v_: str).to_arr(): `arr<str>`
文字列を書記素クラスタ毎に区切り、配列にしたものを返します。  
文字列に孤立サロゲートが含まれない場合、孤立サロゲートを返すことはありません。  

### @(_v_: str).to_unicode_arr(): `arr<str>`
文字列を Unicode コードポイント毎に区切り、配列にしたものを返します。  
書記素クラスタは分割されます。  
文字列に孤立サロゲートが含まれない場合、孤立サロゲートを返すことはありません。  

### @(_v_: str).to_unicode_codepoint_arr(): `arr<num>`
文字列を Unicode コードポイント毎に区切り、それぞれ[コードポイント](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/String/codePointAt)値を取得し配列にしたものを返します。  
文字列に孤立サロゲートが含まれない場合、孤立サロゲートを返すことはありません。  

### @(_v_: str).to_char_arr(): `arr<str>`
文字列を UTF-16 コード単位毎に区切り、配列にしたものを返します。  
文字列にサロゲートペアが含まれる場合、上位と下位それぞれ孤立サロゲートを返します。

### @(_v_: str).to_charcode_arr(): `arr<num>`
文字列を UTF-16 コード単位毎に区切り、それぞれ[UTF-16 コード単位を表す `0` から `65535` までの整数](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/String/charCodeAt)を取得し配列にしたものを返します。  
文字列にサロゲートペアが含まれる場合、上位と下位それぞれ孤立サロゲートを返します。

### @(_v_: str).to_utf8_byte_arr(): `arr<num>`
文字列を UTF-8 エンコードし、各バイト毎の `0` から `255` までの整数値を取得し配列にしたものを返します。  

### @(_v_: str).pick(_i_: num): str | null
文字列中の _i_ 番目の文字を取得します。  

### @(_v_: str).incl(_keyword_: str): bool
文字列中に _keyword_ が含まれていれば`true`、なければ`false`を返します。  

### @(_v_: str).slice(_begin_: num, _end_: num): str
文字列の _begin_ 番目から _end_ 番目の直前までの部分を取得します。  

### @(_v_: str).split(_splitter_?: str): arr<str>
文字列を _splitter_ がある場所で区切り、配列にしたものを返します。  
_splitter_ が与えられなければ一文字づつ区切ります。  

### @(_v_: str).replace(_old_: str, _new_: str): str
文字列中の _old_ を _new_ に置換したものを返します。  

### @(_v_: str).index_of(_search_: str, _fromIndex_?: num): num
文字列中から_search_を探し、その添字を返します。  
_fromIndex_が指定されていれば、その位置から検索を開始します。  
_fromIndex_が負値の時は末尾からの位置（文字列の長さ+_fromIndex_）が使用されます。  
該当が無ければ-1を返します。

### @(_v_: str).pad_start(_width_: num, _pad_?: str): str
文字列の長さがが _width_ になるように、先頭を _pad_ の繰り返しで埋めた新しい文字列を返します。\
_pad_ を省略した場合、空白`' '`で埋められます。\
_pad_ が長すぎる場合、_pad_ の末尾が切り捨てられます。

### @(_v_: str).pad_end(_width_: num, _pad_?: str): str
文字列の長さがが _width_ になるように、末尾を _pad_ の繰り返しで埋めた新しい文字列を返します。\
_pad_ を省略した場合、空白`' '`で埋められます。\
_pad_ が長すぎる場合、_pad_ の末尾が切り捨てられます。

### @(_v_: str).trim(): str
文字列の前後の空白を取り除いたものを返します。

### @(_v_: str).upper(): str
文字列中の英字を大文字に変換して返します。

### @(_v_: str).lower(): str
文字列中の英字を小文字に変換して返します。

### @(_v_: str).charcode_at(_i_: num): num | null
_i_ 番目のにある [UTF-16 コード単位を表す `0` から `65535` までの整数](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/String/charCodeAt)を返します。  
インデックスは UTF-16 コード単位に基づきます。  
文字列にサロゲートペアが含まれる場合、位置によって上位または下位の孤立サロゲートを返すことがあります。  
_i_ 番目の文字が存在しない場合は null が返されます。  

### @(_v_: str).codepoint_at(_i_: num): num | null
_i_ 番目の文字の[コードポイント](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/String/codePointAt)を取得します。  
インデックスは UTF-16 コード単位に基づきます。  
文字列にサロゲートペアが含まれ、指定位置が下位のサロゲートである場合、下位の孤立サロゲートを返します。  
_i_ 番目の文字が存在しない場合は null が返されます。  

## 配列
### #(_v_: arr).len
型: `num`  
配列の要素数を取得します。

### @(_v_: arr).push(_i_: value): null
**【この操作は配列を書き換えます】**  
配列の最後に要素を追加します。  

### @(_v_: arr).unshift(i: value): null
**【この操作は配列を書き換えます】**  
配列の最初に要素を追加します。  

### @(_v_: arr).pop(): value
**【この操作は配列を書き換えます】**  
配列の最後の要素を取り出します。  

### @(_v_: arr).shift(): value
**【この操作は配列を書き換えます】**  
配列の最初の要素を取り出します。  

### @(_a_: arr).concat(_b_: arr): arr
配列を連結します。  

### @(_v_: arr<str>).join(_joiner_?: str): str
文字列の配列を結合して一つの文字列として返します。  

### @(_v_: arr).slice(_begin_: num, _end_: num): arr
配列の _begin_ 番目から _end_ 番目の部分を切り出して返します。

### @(_v_: arr).incl(_i_: value): bool
配列に指定した値が含まれているかどうかを返します。  

### @(_v_: arr).map(_func_: fn): arr
配列の各要素に対し _func_ を非同期的に呼び出します。
それぞれの要素を _func_ の返り値で置き換えたものを返します。  

### @(_v_: arr).filter(_func_: fn): arr
配列の要素のうち _func_ が true を返すようなもののみを抜き出して返します。  
順序は維持されます。  

### @(_v_: arr).reduce(_func_: Callback, _initial_: value): value
`Callback`: @(_acm_: value, _item_: value, _index_: num): value  
配列の各要素に対し _func_ を順番に呼び出します。  
各呼び出しでは、前回の結果が第1引数 _acm_ として渡されます。  
_initial_ が指定された場合は初回呼び出しの引数が(_initial_, _v_\[0], 0)、  
指定されなかった場合は(_v_\[0], _v_\[1], 1)となります。  
配列が空配列であり、かつ _initial_ が指定されていない場合はエラーになります。従って基本的には _initial_ を指定しておくことが推奨されています。  

### @(_v_: arr).find(_func_: @(_item_: value, _index_: num) { bool }): value
配列から _func_ が true を返すような要素を探し、その値を返します。  

### @(_v_: arr).index_of(_val_: value, _fromIndex_?: num): num
配列から_val_と同じ値を探し、その添字を返します。  
_fromIndex_が指定されていれば、その位置から検索を開始します。  
_fromIndex_が負値の時は末尾からの位置（配列の長さ+_fromIndex_）が使用されます。  
該当が無ければ-1を返します。

### @(_v_: arr).reverse(): null
**【この操作は配列を書き換えます】**  
配列を反転させます。  

### @(_v_: arr).copy(): arr
配列のコピーを生成します。  
シャローコピーであり、配列やオブジェクトの参照は維持されます。  

### @(_v_: arr).sort(_comp_: @(_a_: value, _b_: value)): arr
**【この操作は配列を書き換えます】**  
配列の並べ替えをします。第1引数 _comp_ として次のような比較関数を渡します。  
* _a_ が _b_ より順番的に前の時、負の値を返す
* _a_ が _b_ より順番的に後の時、正の値を返す
* _a_ が _b_ と順番的に同等の時、0を返す

数値の並び替えでは`Core:sub`を渡すことで昇順、`@(a,b){b-a}`を渡すことで降順ソートができます。  
文字列用の比較関数として`Str:lt`（昇順）, `Str:gt`（降順）が用意されています。詳しくは[std.md](std.md#-str)をご覧下さい。  

### @(_v_: arr).fill(_val_?: value, _fromIndex_?: num, _toIndex_?: num): arr
**【この操作は配列を書き換えます】**  
配列の _fromIndex_ から _toIndex_ までの範囲の要素を _val_ で置き換えます。  
_val_ 省略時は`null`で置き換えます。  
_fromIndex_ および _toIndex_ に関する挙動は`arr.slice`に準拠します。  

### @(_v_: arr).repeat(_times_: num): arr
配列を _times_ 回繰り返した配列を作成します。  
`arr.copy`同様シャローコピーであり、配列やオブジェクトの参照は維持されます。  
_times_ には0以上の整数値を指定します。それ以外ではエラーになります。  

### @(_v_: arr).insert(_index_: num, _item_: value): null
**【この操作は配列を書き換えます】**  
配列の _index_ の位置に _item_ を挿入します。\
_index_ が負の場合は末尾から数えます。\
_index_ が最後の要素より後の場合は末尾に追加します。

### @(_v_: arr).remove(_index_: num): value | null
**【この操作は配列を書き換えます】**  
配列から _index_ の位置の要素を取り除き、その要素を返します。\
_index_ が負の場合は末尾から数えます。\
_index_ が最後の要素より後の場合は取り除かず、`null`を返します。

### @(_v_: arr).every(_func_: @(_item_: value, _index_: num) { bool }): bool
配列の全ての要素に対して _func_ が true を返す時のみ true 返します。空配列には常に true を返します。

### @(_v_: arr).some(_func_: @(_item_: value, _index_: num) { bool }): bool
配列の要素に対して _func_ が true を返す要素が存在する時のみ true 返します。

## エラー型
### #(_v_: error).name
型: `str`  
エラーの識別子となる文字列を取得します。

### #(_v_: error).info
型: `value`  
エラーに付加情報がある場合、それを取得します。
