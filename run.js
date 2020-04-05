const fs = require('fs');
const parse = require('./built/parser/parser.js').parse;
const std = require('./built/std.js').std;
const run = require('./built/interpreter.js').run;

const script = fs.readFileSync('./test.moe', 'utf8');
const ast = parse(script);
run(ast, std);
