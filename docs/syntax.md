# Syntax

[Read translated version (en)](../translations/en/docs/syntax.md)

## コメント
`//`で始めた行はコメントになり、プログラムの動作に影響を与えません。

```
// this is a comment
```

## 変数宣言
```
let answer = 42
```

## if
```
if answer == 42 {
	print("correct answer")
}
```

else:
```
if answer == 42 {
	print("correct answer")
} else {
	print("wrong answer")
}
```

else if:
```
if eq(answer, "bebeyo") {
	print("correct answer")
} elif eq(answer, "ai") {
	print("kawaii")
} else {
	print("wrong answer")
}
```

as expression:
```
let result =
	if answer == "bebeyo" { "correct answer" }
	elif answer == "ai" { "kawaii" }
	else { "wrong answer" }

print(result)
```

## for
```
for let i, 10 {
	print(i)
}
```

## Block
```
let foo = eval {
	let x = 1
	let y = 2
	x + y
}

print(foo) // 3
```

## Function
```
@inc(x) {
	x + 1
}

print(inc(42)) // 43
```
