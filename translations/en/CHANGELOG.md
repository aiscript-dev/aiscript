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
