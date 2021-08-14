const fs = require('fs');
const { parse } = require('./built/index.js');

function transformMapToObj(key, value) {
	if (Object.prototype.toString.call(value) == '[object Map]') {
		// conv map -> object
		const obj = { };
		for (const [k, v] of value) {
			obj[k] = v;
		}
		return obj;
	}
	else {
		return value;
	}
}

const script = fs.readFileSync('./test.is', 'utf8');
const ast = parse(script);
console.log(JSON.stringify(ast, transformMapToObj, 2));
