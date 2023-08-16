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

### @(_v_: str).index_of(_search_: str): num

### @(_v_: str).trim(): str

### @(_v_: str).upper(): str

### @(_v_: str).lower(): str

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

### @(_v_: arr).incl(_i_: str | num | bool | null): bool
配列に指定した値が含まれているかどうかを返します。  

### @(_v_: arr).map(_f_: fn): arr

### @(_v_: arr).filter(_f_: fn): arr

### @(_v_: arr).reduce(_f_: @(_acm_: value, _item_: value, _index_: num) { value }, _initial_: value): value

### @(_v_: arr).find(_f_: @(_item_: value, _index_: num) { bool }): value
配列から要素を探します。  

### @(_v_: arr).reverse(): null
配列を反転させます。  

### @(_v_: arr).copy(): arr
配列のコピーを生成します。  

### @(_v_: arr).sort(comp: @(a: value, b: value)): arr
配列をソートします。  
compにはStr:lt, Str:gtと同様のnumを返す比較関数を渡します。
