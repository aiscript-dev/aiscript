[Read translated version (en)](../translations/en/docs/builtin-props.md)

組み込みプロパティとは、型ごとに用意された特殊な値あるいは関数です。  
オブジェクトのプロパティのように`.<name>`の記法で呼び出すことができます。（`[<str>]`の記法は使えません）
```js
// 例
'ai kawaii'.len //9

Core:range(0,2).push(4) //[0,1,2,4]
```
今の所、数値・文字列・配列・エラー型に対応するものが用意されています。オブジェクトのそれに相当するものは、記法との兼ね合いで[std関数](std.md#-obj)として実装されています。

## 書式
本ページでは、（型名）型の任意の値に対する組み込みプロパティを下記のような形式で表記します。
> #(_v_: 型名).プロパティ名  
> // または  
> @(_v_: 型名).組み込みメソッド名(引数リスト): 返り値の型  

\#から始まるものは関数以外の値を持つ組み込みプロパティです。
\@から始まるものは関数の組み込みプロパティ（組み込みメソッド）です。

## 数値
### @(_x_: num).to_str(): str
数値を文字列に変換します。  


## 文字列
### #(_v_: str).len
型: `num`  
文字列の長さを取得します。  

### @(_v_: str).to_num(): num | null
文字列が数字であれば、数値に変換します。  

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

### @(_v_: str).index_of(_search_: str): num
文字列中から _search_ を検索し、あれば何文字に存在したかを、なければ-1を返します。

### @(_v_: str).trim(): str
文字列の前後の空白を取り除いたものを返します。

### @(_v_: str).upper(): str
文字列中の英字を大文字に変換して返します。

### @(_v_: str).lower(): str
文字列中の英字を小文字に変換して返します。

### @(_v_: str).codepoint_at(_i_: num): num | null
_i_ 番目の文字の[コードポイント](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/String/codePointAt)を取得します。  
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

### @(_v_: arr).incl(_i_: str | num | bool | null): bool
配列に指定した値が含まれているかどうかを返します。  

### @(_v_: arr).map(_func_: fn): arr
配列の各要素に対し _func_ を非同期的に呼び出します。
それぞれの要素を _func_ の返り値で置き換えたものを返します。  

### @(_v_: arr).filter(_func_: fn): arr
配列の要素のうち _func_ が true を返すようなもののみを抜き出して返します。  
順序は維持されます。  

### @(_v_: arr).reduce(_func_: @(_acm_: value, _item_: value, _index_: num) { value }, _initial_: value): value
配列の各要素に対し _func_ を順番に呼び出します。  
各呼び出しでは、前回の結果が第1引数 _acm_ として渡されます。  
_initial_ が指定された場合は初回呼び出しの引数が(_initial_, _v_\[0], 0)、  
指定されなかった場合は(_v_\[0], _v_\[1], 1)となります。  

### @(_v_: arr).find(_func_: @(_item_: value, _index_: num) { bool }): value
配列から _func_ が true を返すような要素を探し、その値を返します。  

### @(_v_: arr).reverse(): null
**【この操作は配列を書き換えます】**  
配列を反転させます。  

### @(_v_: arr).copy(): arr
配列のコピーを生成します。  

### @(_v_: arr).sort(_comp_: @(_a_: value, _b_: value)): arr
**【この操作は配列を書き換えます】**  
配列の並べ替えをします。第1引数 _comp_ として次のような比較関数を渡します。  
* _a_ が _b_ より順番的に前の時、負の値を返す
* _a_ が _b_ より順番的に後の時、正の値を返す
* _a_ が _b_ と順番的に同等の時、0を返す

数値の並び替えでは`Core:sub`を渡すことで昇順、`@(a,b){b-a}`を渡すことで降順ソートができます。  
文字列用の比較関数として`Str:lt`（昇順）, `Str:gt`（降順）が用意されています。詳しくは[std.md](std.md#-str)をご覧下さい。  

## エラー型
### #(_v_: error).name
型: `str`  
エラーの識別子となる文字列を取得します。

### #(_v_: error).info
型: `value`  
エラーに付加情報がある場合、それを取得します。
