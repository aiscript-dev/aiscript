# Syntax
## Comments
Lines that begin with `//` are comments and do not affect the behavior of the program.

```
// this is a comment
```

## Variable declaration
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
} elif {
	print("wrong answer")
}
```

else if:
```
if answer == "bebeyo" {
	print("correct answer")
} elif answer == "ai" {
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
