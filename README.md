<h1><img src="./aiscript.svg" alt="AiScript" width="300"></h1>

**AiScript** is a scripting language runing on JavaScript. Not altJS.

AiScriptは、汎用性の高いマルチパラダイムなプログラミング言語です。
柔軟性を持ちつつ、厄介なものは排除して、使っていて楽しい言語を目指しました。

* 配列、オブジェクト、関数等をファーストクラスでサポート
* 条件分岐やブロックも式として柔軟に扱える
* 例外なし
* セミコロンやカンマは不要

AiScriptはJavaScript上で動作し、外の情報にはアクセス出来ないサンドボックス環境で安全にプログラムが実行されます。
そのため様々なアプリケーションに組み込んで使うことができ、必要に応じてホストから変数や関数を提供することで、簡単にアプリケーションの機能を使ったスクリプトを書かせることも出来ます。

## Getting started
[See here](./docs/get-started.md)

## Example programs
### Hello world
```
<: "Hello, world!"
```

### Fizz Buzz
```
~ (#i, 100) {
  <: ? ((i % 15) = 0) "FizzBuzz"
    .? ((i % 3) = 0) "Fizz"
    .? ((i % 5) = 0) "Buzz"
    . i
}
```
