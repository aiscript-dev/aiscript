# (unreleased)
## Breaking changes
- `? ~ .? ~ .` → `if ~ elif ~ else`
- `? x { 42 => yes }` → `match x { 42 => yes }`
- `_` → `null`
- `<<` → `return`
- `~` → `for`
- `~~` → `each`
- `+ attributeName attributeValue` → `#[attributeName attributeValue]`
- Removed `+`/`-` notation for truth values.
- for and each no longer return an array

## Features
- `continue`
- `break`
- `loop`

## Fixes
- Fixed an issue where empty functions could not be defined.
- Fixed an issue where empty scripts were not allowed.
- Fixed increment and decrement of namespaced variables.
- Fixed an issue that prevented assignment to variables with namespaces.
