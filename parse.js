const fs = require('fs');
const parse = require('./built/parser/parser.js').parse;

const script = fs.readFileSync('./test.moe', 'utf8');
const ast = parse(script);
console.log(JSON.stringify(ast, null, 2));
