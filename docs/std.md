## std

### @print(message: str): void
画面に文字列を表示します。

### @readline(message: str): str
文字列の入力を受け付けます。

## :: Core

### @Core:type(v: value): str
型名を取得します。

### @Core:to_str(v: value): str
表す文字列を取得します。

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

### @Date:year(): num

### @Date:month(): num

### @Date:day(): num

### @Date:hour(): num

### @Date:minute(): num

### @Date:second(): num

### @Date:parse(date: str): num

## :: Math

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

### @Math:max(a: num, b: num): num

### @Math:rnd(x: num): num

### @Math:gen_rng(seed: num | str): fn

## :: Num

### @Num:to_hex(x: num): str
数値から16進数の文字列を生成します。

### @Num:from_hex(hex: str): num
16進数の文字列から数値を生成します。

## :: Str

### @Str:to_num()

### @Str:len()
文字列の長さを取得します。

### @Str:pick()

### @Str:incl()

### @Str:slice()

### @Str:split()

### @Str:replace()

### @Str:index_of()

### @Str:trim()

### @Str:upper()

### @Str:lower()

## :: Arr

### @Arr:len()

### @Arr:push()

### @Arr:unshift()

### @Arr:pop()

### @Arr:shift()

### @Arr:concat()

### @Arr:join()

### @Arr:slice()

### @Arr:incl()

### @Arr:map()

### @Arr:filter()

### @Arr:reduce()

### @Arr:find()

### @Arr:reverse()

### @Arr:copy()

## :: Obj

### @Obj:keys()

### @Obj:kvs()

### @Obj:get()

### @Obj:set()

### @Obj:has()

### @Obj:copy()

## :: Async

### @Async:interval()

### @Async:timeout()

