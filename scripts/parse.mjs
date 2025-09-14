import fs from 'fs';
import { Parser } from '@syuilo/aiscript';
import { inspect } from 'util';

const script = fs.readFileSync('./main.ais', 'utf8');
const ast = Parser.parse(script);
console.log(inspect(ast, { depth: 10 }));
