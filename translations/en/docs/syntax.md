# Syntax
## Comments
Lines that begin with `//` are comments and do not affect the behavior of the program.

```
// this is a comment
```

## Variable declaration
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
#result =
	? eq(answer, "bebeyo") { "correct answer" }
	.? eq(answer, "ai") { "kawaii" }
	. { "wrong answer" }

print(result)
```

## for
```
for #i, 10 {
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
