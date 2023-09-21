import fs from 'fs';
import { Parser } from '@syuilo/aiscript';

const script = fs.readFileSync('./debug.ais', 'utf8');
const ast = Parser.parse(script);
console.log(JSON.stringify(ast, null, 2));
