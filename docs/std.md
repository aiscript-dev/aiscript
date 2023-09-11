*English translation has been left out of date for a long time. 
[Please contribute!](../translations/en/docs/std.md)*

## 標準定数・標準関数について
Aiscriptで最初から定義されていてどこでも使える定数・関数を指します。  
standardを省略してstd定数/関数とも呼ばれています。
## 書式
> #Core:v

`Core:v`という標準定数を表します。
> @Core:type(_v_: value): str

`Core:type`という標準関数を表します。  
`v`という名のvalue型（つまり任意の型）の引数を一つとり、str型（文字列型）の値を返します。

# 一覧

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

### @Core:sleep(_time_: value): void
指定時間（ミリ秒）待機します。
## :: Util

### @Util:uuid(): str
新しいUUIDを生成します。  

## :: Json

### @Json:stringify(_v_: value): str
JSONを生成します。  

### @Json:parse(_json_: str): value
JSONをパースします。 引数がJSONとしてパース可能性でない場合、エラー型の値（`name`=`'not_json'`）を返します。 

### @Json:parsable(_str_: str): bool
文字列がJSONとしてパース可能であるかの判定を行います。歴史的理由により存在しています 

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

### #Str:from_codepoint(codepoint: num): str
unicodeのコードポイントから文字を生成します。

_codepoint_ は 0 以上、10FFFF<sub>16</sub> 以下である必要があります。

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
