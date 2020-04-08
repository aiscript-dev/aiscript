const fs = require('fs');
const parse = require('./built/parser/parser.js').parse;
const core = require('./built/interpreter/lib/core.js').core;
const std = require('./built/interpreter/lib/std.js').std;
const run = require('./built/interpreter/index.js').run;

const script = fs.readFileSync('./test.moe', 'utf8');
const ast = parse(script);
run(ast, { ...std, ...core });
