## Std constants & functions
Refers to constants and functions that are defined during initialization of the AiScript interpreter and can be used anywhere in script.

## Format
> #Core:v

A prefix `#` indicates a std constant.  
In this case, the name is `Core:v`.
> @Core:type(_v_: value): str

A prefix `@` indicates a std function.  
The example shown is a function called `Core:type`,
it takes one argument of type `value` (i.e., any type) named `v` and returns a value of type `str` (string type).

# List

## std
### @print(message: str): void
Outputs a string. (In most cases the string will be displayed on screen, but behavior is up to the host implementation.)  

### @readline(message: str): str
Accepts input of character strings.  

## :: Core
### #Core:v
Type: `str`.  
AiScript version.

### @Core:type(v: value): str
Gets the type name of the value.  

### @Core:to_str(v: value): str
Gets a string representation of a value.  

### @Core:sleep(_time_: value): void
Waits for the specified time (milliseconds).  

## :: Util
### @Util:uuid(): str
Generates a new UUID.

## :: Json
### @Json:stringify(v: value): str
Generates JSON from a value.

### @Json:parse(json: str): value
Parses JSON into value.  
Returns an error type value (`name`=`'not_json'`) if given string is not parsable as JSON.  

### @Json:parsable(_str_: str): bool
Determines if a string can be parsed as JSON. Exists for historical reasons.  

## :: Date
### @Date:now(): num
Gets the current time as a number for use in the functions below.  Technically, the value is the same as when you use `Date.now()` in Javascript.

### @Date:year(_date_?: num): num
### @Date:month(_date_?: num): num
### @Date:day(_date_?: num): num
### @Date:hour(_date_?: num): num
### @Date:minute(_date_?: num): num
### @Date:second(_date_?: num): num
Gets the current value of the corresponding unit of time.  
If a value obtained with `Date:now()` is passed as an argument, it returns the value corresponding to that time.  

### @Date:parse(date: str): num
If the string can be interpreted as a time, converts into the same format as `Date:now()`.  
For conversion, it uses the JavaScript Date constructor internally.

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

### @Math:ceil(x: num): num

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

### #Str:lt(a: str, b: str): num
Returns -1 if a < b,  
0 if a == b,  
or 1 if a > b.  
Using this as a comparison function for `arr.sort`, the array is sorted in ascending lexicographic order.  

### #Str:gt(a: str, b: str): num
Returns -1 if a > b,  
0 if a == b,  
or 1 if a < b.  
Using this as the comparison function for `arr.sort`, the array is sorted in descending lexicographic order.  

### #Str:from_codepoint(codepoint: num): str
Generates character from unicode code point.   
_codepoint_ must be greater than or equal to 0 and less than or equal to 10FFFFFF<sub>16</sub>.
Multiple arguments are not supported yet.  

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
### @Obj:vals(v: obj): arr
### @Obj:kvs(v: obj): arr
Returns an array of object keys, values, and key/value pairs, respectively.  

### @Obj:get(v: obj, key: str): value
Gets the value corresponding to the given key of the object.  
Equivalent to `obj[key]`.  

### @Obj:set(v: obj, key: str, val: value): null
Sets the value corresponding to the given key of the object.  
Equivalent to `obj[key] = val`.  

### @Obj:has(v: obj, key: str): bool
Checks if `obj[key]` exists.  

### @Obj:copy(v: obj): obj
Generate a copy of the object.  

## :: Async

### @Async:interval(interval: num, callback: fn, immediate?: bool): fn
Calls the callback function at the specified period.  
Returns the stop function as a return value.  

### @Async:timeout(delay: num, callback: fn):
Calls the callback function after the specified time has elapsed.  
Returns the stop function as a return value.  
