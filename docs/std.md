[Read translated version](../translations/en/docs/std.md)

## std

### @print(_message_: str): void
画面に文字列を表示します。  

### @readline(_message_: str): str
文字列の入力を受け付けます。  

## :: Core

### #Core:v
型: `str`  
AiScriptのバージョンです。  

### @Core:type(_v_: value): str
値の型名を取得します。  

### @Core:to_str(_v_: value): str
値を表す文字列を取得します。  

## :: Util

### @Util:uuid(): str
新しいUUIDを生成します。  

## :: Json

### @Json:stringify(_v_: value): str
JSONを生成します。  

### @Json:parse(_json_: str): value
JSONをパースします。  

## :: Date

### @Date:now(): num
現在時刻を取得します。  

### @Date:year(_date_?: num): num
時刻の年を取得します。
_date_ を渡した場合、_date_に対応する年、  
渡していない場合は現在時刻の年が返されます。    

### @Date:month(_date_?: num): num
現在時刻の月を取得します。  
_date_ を渡した場合、_date_に対応する月、  
渡していない場合は現在時刻の月が返されます。    

### @Date:day(_date_?: num): num
現在時刻の日を取得します。  
_date_ を渡した場合、_date_に対応する日、  
渡していない場合は現在時刻の日が返されます。    

### @Date:hour(_date_?: num): num
現在時刻の時を取得します。  
_date_ を渡した場合、_date_に対応する時、  
渡していない場合は現在時刻の時が返されます。    

### @Date:minute(_date_?: num): num
現在時刻の分を取得します。  
_date_ を渡した場合、_date_に対応する分、  
渡していない場合は現在時刻の分が返されます。    

### @Date:second(_date_?: num): num
現在時刻の秒を取得します。  
_date_ を渡した場合、_date_に対応する秒、  
渡していない場合は現在時刻の秒が返されます。    

### @Date:parse(_date_: str): num

## :: Math

### #Math:PI
型: `num`  
円周率です。  

### @Math:sin(_x_: num): num
正弦を計算します。  

### @Math:cos(_x_: num): num
余弦を計算します。  

### @Math:abs(_x_: num): num
絶対値を計算します。  

### @Math:sqrt(_x_: num): num
平方根を計算します。  

### @Math:round(_x_: num): num
四捨五入して、もっとも近い整数を返します。

### @Math:ceil(_x_: num): num
引数以上の最小の整数を返します。

### @Math:floor(_x_: num): num
引数以下の最大の整数を返します。

### @Math:min(_a_: num, _b_: num): num
小さい方の値を取得します。  

### @Math:max(_a_: num, _b_: num): num
大きい方の値を取得します。  

### @Math:rnd(_min_?: num, _max_?: num): num
乱数を生成します。  
_min_ および _max_ を渡した場合、_min_ <= x, x <= _max_ の整数、  
渡していない場合は 0 <= x, x < 1 の 小数が返されます。  

### @Math:gen_rng(_seed_: num | str): fn
シードから乱数生成機を生成します。  

## :: Num

### @(_x_: num).to_str(): str
値を表す文字列を取得します。  

### @Num:to_hex(_x_: num): str
数値から16進数の文字列を生成します。  

### @Num:from_hex(_hex_: str): num
16進数の文字列から数値を生成します。  

## :: Str

### #Str:lf
型: `str`  
改行コード(LF)です。  

### #Str:lt(a: str, b: str): num
a < b ならば -1、a == b ならば 0、a > b ならば 1 を返します。
arr.sortの比較関数として使用できます。

### #Str:gt(a: str, b: str): num
a > b ならば -1、a == b ならば 0、a < b ならば 1 を返します。
arr.sortの比較関数として使用できます。

### @(_v_: str).to_num(): num | null
値を表す数値を取得します。  

### @(_v_: str).len(): num
文字列の長さを取得します。  

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

## :: Arr

### @(_v_: arr).len(): num
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
配列をソートします。compにはStr:lt, Str:gtと同様のnumを返す比較関数を渡します。

## :: Obj

### @Obj:keys(_v_: obj): arr
### @Obj:vals(_v_: obj): arr
### @Obj:kvs(_v_: obj): arr
オブジェクトのキー、値、キーと値の組を配列にして返します。

### @Obj:get(_v_: obj, _key_: str): value

### @Obj:set(_v_: obj, _key_: str, _val_: value): null

### @Obj:has(_v_: obj, _key_: str): bool

### @Obj:copy(_v_: obj): obj
オブジェクトのコピーを生成します。  

## :: Async

### @Async:interval(_interval_: num, _callback_: fn, _immediate_?: bool): fn
指定した周期でコールバック関数を呼び出します。  
戻り値として停止関数を返します。  

### @Async:timeout(_delay_: num, _callback_: fn):
指定した時間経過後にコールバック関数を呼び出します。  
戻り値として停止関数を返します。  
