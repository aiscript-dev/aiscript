<h1><img src="./aiscript.svg" alt="AiScript" width="300"></h1>

[![](https://img.shields.io/npm/v/@syuilo/aiscript.svg?style=flat-square)](https://www.npmjs.com/package/@syuilo/aiscript)
![](https://github.com/syuilo/aiscript/workflows/ci/badge.svg)
[![](https://img.shields.io/badge/license-MIT-444444.svg?style=flat-square)](http://opensource.org/licenses/MIT)
[![](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square&logo=github)](http://makeapullrequest.com)

> **AiScript** is a scripting language runing on JavaScript. Not altJS.

AiScriptは、JavaScript上で動作するマルチパラダイムプログラミング言語です。

* 配列、オブジェクト、関数等をファーストクラスでサポート
* 条件分岐やブロックも式として扱えるなどの柔軟さ
* セミコロンやカンマは不要で書きやすい
* セキュアなサンドボックス環境で実行される
* ホストから変数や関数を提供可能

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
