const fs = require('fs');
const parse = require('./built/parser/index.js').parse;

const script = fs.readFileSync('./test.is', 'utf8');
const ast = parse(script);
console.log(JSON.stringify(ast, null, 2));
