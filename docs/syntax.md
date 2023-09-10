# Syntax

[Read translated version (en)](../translations/en/docs/syntax.md)

## コメント
`//`で始めた行や`/*` `*/`で囲んだ箇所はコメントになり、プログラムの動作に影響を与えません。

```
// this is a comment
/*
   this is a comment too
*/
```

## 変数宣言
```
let answer = 42
```

## if
```
if answer == 42 {
	<: "correct answer"
}
```

### else:
```
if answer == 42 {
	<: "correct answer"
} else {
	<: "wrong answer"
}
```

### else if:
```
if answer == "bebeyo" {
	<: "correct answer"
} elif answer == "ai" {
	<: "kawaii"
} else {
	<: "wrong answer"
}
```

### as expression:
```
let result =
	if answer == "bebeyo" { "correct answer" }
	elif answer == "ai" { "kawaii" }
	else { "wrong answer" }

<: result
```

## for
```
for let i, 10 {
	<: i
}
```

## Block
```
let foo = eval {
	let x = 1
	let y = 2
	x + y
}

<: foo // 3
```

## Function
```
@inc(x) {
	x + 1
}

<: inc(42) // 43
```

## exists
```
let foo = exists bar
let bar = exists foo

<: foo //false
<: bar //true
```
