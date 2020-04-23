<h1><img src="./aiscript.svg" alt="AiScript" width="300"></h1>

[![][npm-badge]][npm-link]
[![][ci-badge]][ci-link]
[![][mit-badge]][mit]
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square&logo=github)](http://makeapullrequest.com)

> **AiScript** is a scripting language runing on JavaScript. Not altJS.

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

## License
[MIT](LICENSE)

[npm-link]:   https://www.npmjs.com/package/@syuilo/aiscript
[npm-badge]:  https://img.shields.io/npm/v/@syuilo/aiscript.svg?style=flat-square
[mit]:        http://opensource.org/licenses/MIT
[mit-badge]:  https://img.shields.io/badge/license-MIT-444444.svg?style=flat-square
[ci-link]:    https://circleci.com/gh/syuilo/aiscript
[ci-badge]:   https://img.shields.io/circleci/project/github/syuilo/aiscript.svg?style=flat-square&logo=circleci
