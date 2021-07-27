const fs = require('fs');
const { parse, analyze } = require('./built/index.js');

const script = fs.readFileSync('./test.is', 'utf8');
const ast = analyze(parse(script));
console.log(JSON.stringify(ast, null, 2));
