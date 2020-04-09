# Syntax
## コメント
`//`で始めた行はコメントになり、プログラムの動作に影響を与えません。

```
// this is a comment
```

## 変数宣言
```
#<variable name> = <value>
```

ex:
```
#answer = 42
```

## if
```
? <condition> {
	<statements>
}
```

with elseif
```
? <condition> {
	<statements>
} ...? <condition> {
	<statements>
}
```

with else
```
? <condition> {
	<statements>
} ... {
	<statements>
}
```

ex:
```
? eq(answer, 42) {
	print("correct answer")
} ... {
	print("wrong answer")
}
```
