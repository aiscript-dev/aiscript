<h1><img src="../../aiscript.svg" alt="AiScript" width="300"></h1>

[![](https://img.shields.io/npm/v/@syuilo/aiscript.svg?style=flat-square)](https://www.npmjs.com/package/@syuilo/aiscript)
![](https://github.com/syuilo/aiscript/workflows/ci/badge.svg)
[![codecov](https://codecov.io/gh/syuilo/aiscript/branch/master/graph/badge.svg?token=R6IQZ3QJOL)](https://codecov.io/gh/syuilo/aiscript)
[![](https://img.shields.io/badge/license-MIT-444444.svg?style=flat-square)](http://opensource.org/licenses/MIT)
[![](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square&logo=github)](http://makeapullrequest.com)

> **AiScript** is a scripting language that runs on JavaScript. Not altJS.

[Play online ▶](https://aiscript-dev.github.io/aiscript/)

AiScript is a multi-paradigm programming language that runs on JavaScript, not AltJS (1).

* First-class support for arrays, objects, functions, etc.
* Flexibility, including conditional branches and blocks can be treated as expressions
* Easy to write, no need for semicolons or commas
* Runs in a secure(2) sandbox environment
* Variables and functions can be provided from the host

> (1) ... It "runs on" JavaScript, not is "converted" to JavaScript. Therefore, it is not AltJS.

> (2) ... Not being able to access the host's information.

This repository contains parsers and processors implemented in JavaScript.

Note: AiScript and [Misskey](https://github.com/syuilo/misskey) are completely independent projects. AiScript does not prescribe any specific host, but Misskey is the largest user of AiScript (today!)

## Getting started (language)
[See here](./docs/get-started.md)

## Getting started (host implementation)
todo

## Example programs
### Hello world
```
<: "Hello, world!"
```

### Fizz Buzz
```
for (#i, 100) {
  <: if (i % 15 == 0) "FizzBuzz"
    elif (i % 3 == 0) "Fizz"
    elif (i % 5 == 0) "Buzz"
    else i
}
```

## License
[MIT](LICENSE)
