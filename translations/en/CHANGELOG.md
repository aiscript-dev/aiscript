# 0.19.0
- Fix: Zero passed to `Date:year` family functions ignored
- Fix location informations in syntax errors and others
- `arr.reduce` now throws a distinct error when called with an empty array and no second argument
- Add `str.pad_start`,`str.pad_end`
- Add `arr.insert`,`arr.remove`
- asynchronization of `arr.sort` for better processing speed
- Add `arr.flat`, `arr.flat_map`
- Add `Uri:encode_full`, `Uri:encode_component`, `Uri:decode_full`, `Uri:decode_component`
- Add `str.starts_with`,`str.ends_with`
- Add `arr.splice`
- Add `arr.at`
- For Hosts: With an error handler, Interpreter now do the abortion of all processes only when `abortOnError` option is set to true

# 0.18.0
- New function `Core:abort` for immediate abortion of the program
- Add array version of `index_of`
- `str.index_of` and `arr.index_of` now accept a second argument
- Remove type restriction on the argument for `arr.incl`
- Add `Date:millisecond`
- Add `arr.fill`, `arr.repeat`, `Arr:create`
- Destructuring assignment available, like JavaScript(but limited functionality now)
- Amend the error message on duplicated declaration of variable
- Variables under nested namespaces are now accessible
- Add `arr.every`, `arr.some`
- Add `Date:to_iso_str`

# 0.17.0
- Fix `package.json`
- New function `Error:create` to create a error-type value
- New function `Obj:merge` to get a merge of two objects
- Fix: Chainings(`[]` for index access, `.` for property access, `()` for function call) used in conjunction with parentheses may cause unexpected behaviour
- New functions: `Str#charcode_at` `Str#to_arr` `Str#to_char_arr` `Str#to_charcode_arr` `Str#to_utf8_byte_arr` `Str#to_unicode_codepoint_arr` `Str:from_unicode_codepoints` `Str:from_utf8_bytes`
- Fix: `Str#codepoint_at` not supporting surrogate pairs
- IndexOutOfRangeError now also occurs when assigning non-integer index or outside boundaries of arrays
## Note
CHANGELOG had a missing record in V0.16.0.
>- Add new functions `Str:from_codepoint` `Str#codepoint_at`

# 0.16.0
- **Namespaces can no longer include `var` (while `let` is available as it has been)**
- `Core:to_str` and template syntax can now convert any type of values into string
- Add `Core:sleep`: waits specified milliseconds
- New syntax: `exists <variable-name>` can judge specified name of variable actually exists in runtime
- Object values can be now referenced via index (ex. `object['index']`)
- New value type: Error Type (type name: `error`)
- `Json:parse` now returns error-type value when parsing failed
- Fix: Variables defined with `let` is yet mutable
- Add new functions `Str:from_codepoint` `Str#codepoint_at`

## For Hosts
- **Breaking Change** Subclasses of AiScriptError now have `AiScript-` prefix (ex. SyntaxError→AiScriptSyntaxError)
- `Interpreter`'s second constructor argument now accepts `err` option: pass a callback function to be called when `Interpreter.exec` fails **or `Async:interval`/`Async:timeout` fails**. Noted that using this feature disables AiScript process from throwing JavaScript errors.
- Native functions can use `opts.topCall` instead of `opts.call` to call error callback when failing like two functions above. **Use only when necessary. If `opts.call` calls error callback correctly, use that.**

# 0.15.0
- Enrichment of `Math:`
- Fix: Terms of operator `&&`, `||` may not be converted correctly

# 0.14.1
- Fix: Short-circuit evaluation of `&&`, `||` is not working correctly
- Fix: operator `+=`, `-=` may overwrite unrelated variable

# 0.14.0
- Add `Obj:vals` that returns an array of values of given object
- Add `Json:parsable` that judges whether given string is parsable with `Json:parse`
- When first argument of or/and determines the result, now second argument is no longer evaluated
- Fix immediate value check in Async:interval

# 0.13.3
- Random number generation now includes specified maximum value in returning range

# 0.13.2
- `Date:year`,`Date:month`,`Date:day`,`Date:hour`,`Date:minute`,`Date:second` are now accepting a number argument to specify the time
- Add `array.sort` and comparison functions `Str:lt`, `Str:gt`
- Random number generation now includes specified maximum value in returning range

# 0.13.1
- Fix: `Json:stringify` returns corrupted value when given functions as argument

# 0.13.0
- Index arguments for callbacks of some array properties are now zero-start: `map`,`filter`,`reduce`,`find`
- Add `@Math:ceil(x: num): num`
- Exponentiation function `Core:pow` and syntax sugar `^`
- Minor fixes of parsing

# 0.12.4
- block comment `/* ... */`
- Math:Infinity

# 0.12.3
- Fix: `break`/`return` does not work in `each` statement
- IndexOutOfRangeError now occurs when accessing outside boundaries of arrays

# 0.12.2
- Logical Not operator `!`
- Adjustment of interpreter processing speed

# 0.12.1
- Single quotes are now available for string literal
- Fix: `return` does not work in for/loop statement
- Runtime now constantly pauses a few milliseconds to prevent infinite loops from causing runtime freezes

# 0.12.0
## Breaking changes
- `#` for variable definition → `let`
- `$` for variable definition → `var`
- `<-` for assignment → `=`
- `=` for comparison → `==`
- `&` → `&&`
- `|` → `||`
- `? ~ .? ~ .` → `if ~ elif ~ else`
- `? x { 42 => yes }` → `match x { 42 => yes }`
- `_` → `null`
- `<<` → `return`
- `~` → `for`
- `~~` → `each`
- `+ attributeName attributeValue` → `#[attributeName attributeValue]`
- Removed `+`/`-` notation for truth values.
- for and each no longer return an array
- Block statement `{ }` → `eval { }`
- Arrays are now indexed from zero
- Some std methods are now written in property-like style:
  - `Str:to_num("123")` -> `"123".to_num()`
  - `Arr:len([1 2 3])` -> `[1 2 3].len`
  - etc

## Features
- `continue`
- `break`
- `loop`

## Fixes
- Fixed an issue where empty functions could not be defined.
- Fixed an issue where empty scripts were not allowed.
- Fixed increment and decrement of namespaced variables.
- Fixed an issue that prevented assignment to variables with namespaces.
