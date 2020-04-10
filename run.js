const fs = require('fs');
const readline = require('readline');
const chalk = require('chalk');
const parse = require('./built/parser/parser.js').parse;
const { valToString, nodeToString } = require('./built/interpreter/util.js');
const AiScript = require('./built/interpreter/index.js').AiScript;

const i = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

const aiscript = new AiScript({}, {
	in(q) {
		return new Promise(ok => {
			i.question(q + ': ', ok);
		});
	},
	out(value) {
		console.log(chalk.magenta(valToString(value, true)));
	},
	log(type, params) {
		/*
		switch (type) {
			case 'node': console.log(chalk.gray(`\t\t${nodeToString(params.node)}`)); break;
			case 'var:add': console.log(chalk.greenBright(`\t\t\t+ #${params.var} = ${valToString(params.val)}`)); break;
			case 'var:read': console.log(chalk.cyan(`\t\t\tREAD #${params.var} : ${valToString(params.val)}`)); break;
			case 'var:write': console.log(chalk.yellow(`\t\t\tWRITE #${params.var} = ${valToString(params.val)}`)); break;
			case 'block:enter': console.log(`\t-> ${params.scope}`); break;
			case 'block:return': console.log(`\t<< ${params.scope}: ${valToString(params.val)}`); break;
			case 'block:leave': console.log(`\t<- ${params.scope}: ${valToString(params.val)}`); break;
			case 'end': console.log(`\t= ${valToString(params.val)}`); break;
			default: break;
		}
		*/
	}
});

const script = fs.readFileSync('./test.is', 'utf8');
const ast = parse(script);

aiscript.exec(ast);
