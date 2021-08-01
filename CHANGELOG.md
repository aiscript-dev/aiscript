# (unreleased)
## 構文、キーワードの変更
- `? ~ .? ~ .` → `if ~ elif ~ else`
- `? x { 42 => yes }` → `match x { 42 => yes }`
- `_` → `null`
- `~` → `for`
- `~~` → `each`
- `+ attributeName attributeValue` → `#[attributeName attributeValue]`
- 真理値の`+`/`-`表記方法を廃止
