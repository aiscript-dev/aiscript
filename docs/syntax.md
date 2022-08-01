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
? eq(answer, 42) {
	print("correct answer")
}
```

else:
```
? eq(answer, 42) {
	print("correct answer")
} . {
	print("wrong answer")
}
```

else if:
```
? eq(answer, "bebeyo") {
	print("correct answer")
} .? eq(answer, "ai") {
	print("kawaii")
} . {
	print("wrong answer")
}
```

as expression:
```
let result =
	? eq(answer, "bebeyo") { "correct answer" }
	.? eq(answer, "ai") { "kawaii" }
	. { "wrong answer" }

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
let foo = {
	let x = 1
	let y = 2
	add(x, y)
}

print(foo) // 3
```

## Function
```
fn inc(x) {
	add(x, 1)
}

print(inc(42)) // 43
```
