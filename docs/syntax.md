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

## リテラル

### 配列
```
[10,20,30]
[10 20 30] // 改行区切り可
```

### オブジェクト
```
{a: 10,b: 20,c: 30} // :後の空白必須
{a: 10 b: 20 c: 30} // :後の空白必須 改行区切りも可
{a: 10;b: 20;c: 30} // :後の空白必須
```

## if
```
if true print(0)
if (true) print(0) // ()外の空白必須
if (true) {print(0)} // ()外の空白必須
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
// for 括弧無し
for 10 print(0)
for let i 10 print(i)
for let i=2,10 print(i)
// for ()
for(10) print(0)
for(let i 10) print(i)
for(let i=2,10) print(i)
// for {}
for 10 {print(0)} // {前の空白必須
for let i 10 {print(i)} // {前の空白必須
for let i=2,10 {print(i)} // {前の空白必須
// for (){}
for(10){print(0)}
for(let i 10){print(i)}
for(let i=2,10){print(i)}
```

## each
```
each let a [] print(0)
each(let a [])print(i)
each let i [] {print(i)} // {前の空白必須
each(let i []){print(i)}
```

## Block
```
eval{print(0)}
```

## Function
```
@inc(x) {
	x + 1
}

<: inc(42) // 43
```

## match
```
match 1{1 => print(1) 2 => print(2)} // 改行区切りも可
match(1){1 => print(1) 2 => print(2)} // 改行区切りも可
```

## exists
```
let foo = exists bar
let bar = exists foo

<: foo //false
<: bar //true
```

## 名前空間
```
:: A { let a = 1 } // A前後の空白必須
A:a // :前後の空白不可
```
