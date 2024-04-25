A built-in property is a special value or function for specific type that can be called in the same notation as an object property.
```js
// example
'ai kawaii'.len //9

Core:range(0,2).push(4) //[0,1,2,4]
```
Currently, built-in properties for types number, string, array, and error are available.  
The object equivalent is implemented as [std function](std.md#-obj) due to confliction of notation.  

## Format
> #(_v_: type_name).prop_name

Prefix # indicates it is a primitive property that is not a function.  
> @(_v_: type_name).prop_name(args): return_type

Prefix @ indicates it is a primitive property that is a function.  

## Number
### @(_x_: num).to_str(): str
Gets string representation of the number. 


## String
### #(_v_: str).len
type: `num`  
Length of the string.  

### @(_v_: str).to_num(): num | null
Gets the numeric value that the string represents.  

### @(_v_: str).pick(_index_: num): str | null
Gets the character at _index_ .  

### @(_v_: str).incl(_keyword_: str): bool
Checks for the presence of _keyword_ in the string.  

### @(_v_: str).slice(_begin_: num, _end_: num): str
Obtains specified portion of the string.  

### @(_v_: str).split(_splitter_?: str): arr<str>
Returns the string separated into array at the point where the _splitter_ is located.  

### @(_v_: str).replace( _old_: str, _new_: str): str
Returns the string with including _old_ (s) replaced with _new_.  

### @(_v_: str).index_of(_search_: str): num
Searches for _search_ in the string and returns its index.  

### @(_v_: str).trim(): str
Returns the string with leading and trailing whitespace removed.  

### @(_v_: str).upper(): str
Returns the string converted to uppercase.  

### @(_v_: str).lower(): str
Returns the string converted to lowercase.  

### @(_v_: str).codepoint_at(_index_: num): num | null
Gets the codepoint of the character at _index_.  
Returns null if the character does not exist there.


## Array
### #(_v_: arr).len
type: `num`  
Number of elements in the array.  

### @(_v_: arr).push(_i_: value): null
**MODIFIES THE ARRAY**  
Appends an element to the end of the array.  

### @(_v_: arr).unshift(i: value): null
**MODIFIES THE ARRAY***  
Prepends an element to the beginning of the array.

### @(_v_: arr).pop(): value
**MODIFIES THE ARRAY***  
Extracts the last element of the array.  

### @(_v_: arr).shift(): value
**MODIFIES THE ARRAY***  
Extracts the first element of the array.  

### @(_a_: arr).concat(_b_: arr): arr
Returns an array concatenating the array and _b_.  

### @(_v_: arr<str>).join(_joiner_?: str): str
Combines all elements of the string array and returns them as a single string.  

### @(_v_: arr).slice(_begin_: num, _end_: num): arr
Obtains specified portion of the array.  

### @(_v_: arr).incl(_val_: value): bool
Checks if there is an element in the array with the value _val_.  

### @(_v_: arr).map(_func_: fn): arr
Executes _func_ for each element of the array asynchronously.  
Returns the array of results.  

### @(_v_: arr).filter(_func_: fn): arr
Executes _func_ for each element of the array asynchronously.  
Returns only those elements of the array for which _func_ returns true.  

### @(_v_: arr).reduce(_func_: @(_acm_: value, _item_: value, _index_: num): value, _initial_?: value): value
Executes _func_ for each element in turn.  
_func_ is given the previous result as _acm_.  
if _initial_ is given, _func_ is initially called with arguments (_initial_, _v_\[0], 0).  
Otherwise, (_v_\[0], _v_\[1], 1).  

### @(_v_: arr).find(_func_: @(_item_: value, _index_: num) { bool }): value
Finds elements in the array such that _func_ returns true.  

### @(_v_: arr).index_of(_val_: value, _fromIndex_?: num): num
Finds a value that equals to _val_, and returns the index.  
If _fromIndex_ is given, the search starts from there.
When _fromIndex_ is negative, index from the end(length of the array + _fromIndex_) is used.
When not found, returns -1.

### @(_v_: arr).reverse(): null
**Modifying**
Reverses the array.  

### @(_v_: arr).copy(): arr
Generates a copy of the array.  

### @(_v_: arr).sort(_comp_: @(_a_: value, _b_: value)): arr
**MODIFIES THE ARRAY***
Sorts the array.  
_comp_ is the comparison function that returns:
* negative value if _a_ should precede _b_
* positive value if _a_ should succeed _b_
* 0 if either is acceptable

`Str:lt` and `Str:gt` are available as comparison function. See [std.md](./std.md#-Str)

## Error type
### #(_v_: error).name
type: `str`  
Identifier string of the error.

### #(_v_: error).info
type: `value`  
Additional information about the error, if any.
