## std

### @print(message: str): void
Display a string on the screen.  

### @readline(message: str): str
Accept input of character strings.  

## :: Core

### #Core:v
Type: `str`.  
AiScript version.

### @Core:type(v: value): str
Get the type name of the value.  

### @Core:to_str(v: value): str
Get a string representing a value.  

## :: Util

### @Util:uuid(): str
Generate a new UUID.

## :: Json

### @Json:stringify(v: value): str
Generate JSON.

### @Json:parse(json: str): value
Parse JSON.  

## :: Date

### @Date:now(): num
Get the current time.

### @Date:year(): num
Get the year of the current time.  

### @Date:month(): num
Get the month of the current time.  

### @Date:day(): num
Get the day of the current time.  

### @Date:hour(): num
Get the current time in hours.  

### @Date:minute(): num
Get the minutes of the current time.  

### @Date:second(): num
Get the current time in seconds.  

### @Date:parse(date: str): num

## :: Math

### #Math:PI
Type: `num`.  
It's pi.

### @Math:sin(x: num): num
Calculate the sine.  

### @Math:cos(x: num): num
Calculate the cosine.  

### @Math:abs(x: num): num
Calculate the absolute value.  

### @Math:sqrt(x: num): num
Calculate the square root.  

### @Math:round(x: num): num

### @Math:floor(x: num): num

### @Math:min(a: num, b: num): num
Get the smaller value.  

### @Math:max(a: num, b: num): num
Get the larger value.  

### @Math:rnd(min?: num, max?: num): num
Generate a random number.  

### @Math:gen_rng(seed: num | str): fn

## :: Num

### @Num:to_hex(x: num): str
Generates a hexadecimal string from a number.  

### @Num:from_hex(hex: str): num
Generates a numeric value from a hexadecimal string.  

## :: Str

### #Str:lf
Type: `str`.  
Newline code (LF).

### @Str:to_num(v: num | str): num | null

### @Str:len(v: str): num
Get the length of a string.

### @Str:pick(v: str, i: num): str | null

### @Str:incl(v: str, keyword: str): bool

### @Str:slice(v: str, begin: num, end: num): str
Get the specified portion of a string.  

### @Str:split(v: str, splitter?: str): arr<str>

### @Str:replace(v: str, old: str, new: str): str

### @Str:index_of(v: str, search: str): num

### @Str:trim(v: str): str

### @Str:upper(v: str): str

### @Str:lower(v: str): str

## :: Arr

### @Arr:len(v: arr): num
Get the number of array elements.  

### @Arr:push(v: arr, i: value): null
Adds an element to the end of an array.  

### @Arr:unshift(v: arr, i: value): null

### @Arr:pop(v: arr): value
Extracts the last element of an array.  

### @Arr:shift(v: arr): value

### @Arr:concat(a: arr, b: arr): arr
Concatenate the arrays.

### @Arr:join(v: arr<str>, joiner?: str): str
Concatenates an array of strings and returns them as a single string.  

### @Arr:slice(v: arr, begin: num, end: num): arr

### @Arr:incl(v: arr, i: str | num | bool | null): bool
Returns whether the array contains the specified value or not.  

### @Arr:map(v: arr, f: fn): arr

### @Arr:filter(v: arr, f: fn): arr

### @Arr:reduce(v: arr, f: @(acm: value, item: value, index: num) { value }, initial: value): value

### @Arr:find(v: arr, f: @(item: value, index: num) { bool }): value
Searches for an element in an array.  

### @Arr:reverse(v: arr): null
Invert the array.  

### @Arr:copy(v: arr): arr
Generate a copy of the array.

## :: Obj

### @Obj:keys(v: obj): arr

### @Obj:kvs(v: obj): arr

### @Obj:get(v: obj, key: str): value

### @Obj:set(v: obj, key: str, val: value): null

### @Obj:has(v: obj, key: str): bool

### @Obj:copy(v: obj): obj
Generate a copy of the object.

## :: Async

### @Async:interval(interval: num, callback: fn, immediate?: bool): fn
Calls the callback function at the specified period.  
Returns the stop function as a return value.  

### @Async:timeout(delay: num, callback: fn):
Calls the callback function after the specified time has elapsed.  
Returns the stop function as a return value.  
