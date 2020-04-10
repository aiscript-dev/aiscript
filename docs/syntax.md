# Syntax
## コメント
`//`で始めた行はコメントになり、プログラムの動作に影響を与えません。

```
// this is a comment
```

## 変数宣言
```
#answer = 42
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
} ... {
	print("wrong answer")
}
```

else if:
```
? eq(answer, "bebeyo") {
	print("correct answer")
} ...? eq(answer, "ai") {
	print("kawaii")
} ... {
	print("wrong answer")
}
```

as expression:
```
#result =
	? eq(answer, "bebeyo") { "correct answer" }
	...? eq(answer, "ai") { "kawaii" }
	... { "wrong answer" }

print(result)
```

## for
```
~ #i, 10 {
	print(i)
}
```

## Block
```
#foo = {
	#x = 1
	#y = 2
	add(x, y)
}

print(foo) // 3
```

## Function
```
@inc(x) {
	add(x, 1)
}

print(inc(42)) // 43
```
