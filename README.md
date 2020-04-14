# AiScript
AiScript is a script language run on JavaScript.
Not altJS.

* ホストから変数や関数を提供することが出来ます
* 外の情報にはアクセス出来ないので安全にスクリプトを実行できます(サンドボックス環境)

## How to use AiScript interpreter
※まず最初に`npm run build`しておいてください

1. ターミナルで`node console`

## How to run your AiScript
※まず最初に`npm run build`しておいてください

1. `test.is`という名前のファイルをこのリポジトリのルートディレクトリに作成する
2. スクリプトをそのファイルに書く
3. `npm start`すると実行されます

## Getting started
[See here](./docs/get-started.md)

## Example programs
### Hello world
```
<: "Hello, world!"
```

### Fizz Buzz
```
~ #i, 100 {
	<: ? ((i % 15) = 0) { "FizzBuzz" }
	...? ((i % 3) = 0) { "Fizz" }
	...? ((i % 5) = 0) { "Buzz" }
	... { i }
}
```
