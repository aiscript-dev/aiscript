# (unreleased)
## Breaking changes
- 比較の`=` → `==`
- `&` → `&&`
- `|` → `||`
- `? ~ .? ~ .` → `if ~ elif ~ else`
- `? x { 42 => yes }` → `match x { 42 => true }`
- `yes` `no` → `true` `false`
- `_` → `null`
- `<<` → `return`
- `~` → `for`
- `~~` → `each`
- `+ attributeName attributeValue` → `#[attributeName attributeValue]`
- 真理値の`+`/`-`表記方法を廃止
- for、およびeachは配列を返さなくなりました

## Features
- `continue`
- `break`
- `loop`

## Fixes
- 空の関数を定義できない問題を修正
- 空のスクリプトが許可されていない問題を修正
- ネームスペース付き変数のインクリメント、デクリメントを修正
- ネームスペース付き変数への代入ができない問題を修正 
