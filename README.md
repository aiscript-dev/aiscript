# AiScript

## How to run your AiScript
※まず最初に`npm run build`しておいてください

1. `test.moe`という名前のファイルをこのリポジトリのルートディレクトリに作成する
2. スクリプトをそのファイルに書く
3. `npm start`すると実行されます

## Syntax
### 変数宣言
```
#<variable name> = <value>
```

ex:
```
#answer = 42
```

### if
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

## std
### @print(message: string): void
画面に文字列を表示します。

## Example programs
### Fizz Buzz
```
coming soon
```
