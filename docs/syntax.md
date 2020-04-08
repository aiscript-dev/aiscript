# Syntax
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
