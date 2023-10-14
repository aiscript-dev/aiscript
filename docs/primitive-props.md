プリミティブ値とは値の型ごとに用意された特殊な値あるいは関数です。  
特定の型の値の後に`.`に続けてプリミティブ値名を記述することで呼び出すことができます。
```js
// 例
'ai kawaii'.len //9

Core:range(0,2).push(4) //[0,1,2,4]
```
今の所、数値・文字列・配列・エラー型に対応するものが用意されています。オブジェクトのそれに相当するものは、記法との兼ね合いで[std関数](std.md#-obj)として実装されています。

## 書式
> #(_v_: 型名).プリミティブ値名

\#から始まるものは関数でないプリミティブ値です。
> @(_v_: 型名).プリミティブ関数名(引数リスト): 返り値の型

\@から始まるものはプリミティブ関数です。

## 数値
### @(_x_: num).to_str(): str
値を表す文字列を取得します。  


## 文字列
### #(_v_: str).len
型: `num`  
文字列の長さを取得します。  

### @(_v_: str).to_num(): num | null
値を表す数値を取得します。  

### @(_v_: str).pick(_i_: num): str | null

### @(_v_: str).incl(_keyword_: str): bool

### @(_v_: str).slice(_begin_: num, _end_: num): str
文字列の指定した部分を取得します。  

### @(_v_: str).split(_splitter_?: str): arr<str>

### @(_v_: str).replace( _old_: str, _new_: str): str

### @(_v_: str).index_of(_search_: str, _fromIndex_?: num): num
文字列中から_search_を探し、その添字を返します。  
_fromIndex_が指定されていれば、その位置から検索を開始します。  
_fromIndex_が負値の時は末尾からの位置（文字列の長さ+_fromIndex_）が使用されます。  
該当が無ければ-1を返します。

### @(_v_: str).trim(): str

### @(_v_: str).upper(): str

### @(_v_: str).lower(): str

### @(_v_: str).codepoint_at(_i_: num): num | null
インデックスにある文字のコードポイントを取得します。

文字が存在しない場合は null が返されます。


## 配列
### #(_v_: arr).len
型: `num`  
配列の要素数を取得します。

### @(_v_: arr).push(_i_: value): null
配列の最後に要素を追加します。  

### @(_v_: arr).unshift(i: value): null

### @(_v_: arr).pop(): value
配列の最後の要素を取り出します。  

### @(_v_: arr).shift(): value

### @(_a_: arr).concat(_b_: arr): arr
配列を連結します。  

### @(_v_: arr<str>).join(_joiner_?: str): str
文字列の配列を結合して一つの文字列として返します。  

### @(_v_: arr).slice(_begin_: num, _end_: num): arr

### @(_v_: arr).incl(_i_: value): bool
配列に指定した値が含まれているかどうかを返します。  

### @(_v_: arr).map(_f_: fn): arr

### @(_v_: arr).filter(_f_: fn): arr

### @(_v_: arr).reduce(_f_: @(_acm_: value, _item_: value, _index_: num) { value }, _initial_: value): value

### @(_v_: arr).find(_f_: @(_item_: value, _index_: num) { bool }): value
配列から検査関数_f_に合格する値を探します。  

### @(_v_: arr).index_of(_val_: value, _fromIndex_?: num): num
配列から_val_と同じ値を探し、その添字を返します。  
_fromIndex_が指定されていれば、その位置から検索を開始します。  
_fromIndex_が負値の時は末尾からの位置（配列の長さ+_fromIndex_）が使用されます。  
該当が無ければ-1を返します。

### @(_v_: arr).reverse(): null
配列を反転させます。  

### @(_v_: arr).copy(): arr
配列のコピーを生成します。  

### @(_v_: arr).sort(comp: @(a: value, b: value)): arr
配列をソートします。compにはStr:lt, Str:gtと同様のnumを返す比較関数を渡します。

## エラー型
### #(_v_: error).name
型: `str`  
エラーの識別子となる文字列を取得します。

### #(_v_: error).info
型: `value`  
エラーに付加情報がある場合、それを取得します。
