## std

### @print(message: str): void
画面に文字列を表示します。  

### @readline(message: str): str
文字列の入力を受け付けます。  

## :: Core

### #Core:v
型: `str`  
AiScriptのバージョンです。  

### @Core:type(v: value): str
値の型名を取得します。  

### @Core:to_str(v: value): str
値を表す文字列を取得します。  

## :: Util

### @Util:uuid(): str
新しいUUIDを生成します。  

## :: Json

### @Json:stringify(v: value): str
JSONを生成します。  

### @Json:parse(json: str): value
JSONをパースします。  

## :: Date

### @Date:now(): num
現在時刻を取得します。  

### @Date:year(): num
現在時刻の年を取得します。  

### @Date:month(): num
現在時刻の月を取得します。  

### @Date:day(): num
現在時刻の日を取得します。  

### @Date:hour(): num
現在時刻の時を取得します。  

### @Date:minute(): num
現在時刻の分を取得します。  

### @Date:second(): num
現在時刻の秒を取得します。  

### @Date:parse(date: str): num

## :: Math

### #Math:PI
型: `num`  
円周率です。  

### @Math:sin(x: num): num
正弦を計算します。  

### @Math:cos(x: num): num
余弦を計算します。  

### @Math:abs(x: num): num
絶対値を計算します。  

### @Math:sqrt(x: num): num
平方根を計算します。  

### @Math:round(x: num): num

### @Math:floor(x: num): num

### @Math:min(a: num, b: num): num
小さい方の値を取得します。  

### @Math:max(a: num, b: num): num
大きい方の値を取得します。  

### @Math:rnd(min?: num, max?: num): num
乱数を生成します。  

### @Math:gen_rng(seed: num | str): fn

## :: Num

### @Num:to_hex(x: num): str
数値から16進数の文字列を生成します。  

### @Num:from_hex(hex: str): num
16進数の文字列から数値を生成します。  

## :: Str

### #Str:lf
型: `str`  
改行コード(LF)です。  

### @Str:to_num(v: num | str): num | _

### @Str:len(v: str): num
文字列の長さを取得します。  

### @Str:pick(v: str, i: num): str | _

### @Str:incl(v: str, keyword: str): bool

### @Str:slice(v: str, begin: num, end: num): str
文字列の指定した部分を取得します。  

### @Str:split(v: str, splitter?: str): arr<str>

### @Str:replace(v: str, old: str, new: str): str

### @Str:index_of(v: str, search: str): num

### @Str:trim(v: str): str

### @Str:upper(v: str): str

### @Str:lower(v: str): str

## :: Arr

### @Arr:len(v: arr): num
配列の要素数を取得します。  

### @Arr:push(v: arr, i: value): _
配列の最後に要素を追加します。  

### @Arr:unshift(v: arr, i: value): _

### @Arr:pop(v: arr): value
配列の最後の要素を取り出します。  

### @Arr:shift(v: arr): value

### @Arr:concat(a: arr, b: arr): arr
配列を連結します。  

### @Arr:join(v: arr<str>, joiner?: str): str
文字列の配列を結合して一つの文字列として返します。  

### @Arr:slice(v: arr, begin: num, end: num): arr

### @Arr:incl(v: arr, i: str | num | bool | \_): bool
配列に指定した値が含まれているかどうかを返します。  

### @Arr:map(v: arr, f: fn): arr

### @Arr:filter(v: arr, f: fn): arr

### @Arr:reduce(v: arr, f: @(acm: value, item: value, index: num) { value }, initial: value): value

### @Arr:find(v: arr, f: @(item: value, index: num) { bool }): value
配列から要素を探します。  

### @Arr:reverse(v: arr): _
配列を反転させます。  

### @Arr:copy(v: arr): arr
配列のコピーを生成します。  

## :: Obj

### @Obj:keys(v: obj): arr

### @Obj:kvs(v: obj): arr

### @Obj:get(v: obj, key: str): value

### @Obj:set(v: obj, key: str, val: value): _

### @Obj:has(v: obj, key: str): bool

### @Obj:copy(v: obj): obj
オブジェクトのコピーを生成します。  

## :: Async

### @Async:interval(interval: num, callback: fn, immediate?: bool): fn
指定した周期でコールバック関数を呼び出します。  
戻り値として停止関数を返します。  

### @Async:timeout(delay: num, callback: fn):
指定した時間経過後にコールバック関数を呼び出します。  
戻り値として停止関数を返します。  
