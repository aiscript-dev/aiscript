import fs from 'fs';
import * as readline from 'readline';
import chalk from 'chalk';
import { Parser, Interpreter, errors, utils } from '@syuilo/aiscript';
const { AiScriptError } = errors;
const { valToString } = utils;

const i = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

const interpreter = new Interpreter({}, {
	in(q) {
		return new Promise(ok => {
			i.question(q + ': ', ok);
		});
	},
	out(value) {
		console.log(chalk.magenta(valToString(value, true)));
	},
	err(e) {
		console.log(chalk.red(`${e}`));
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
try {
	const ast = Parser.parse(script);
	await interpreter.exec(ast);
} catch (e) {
	if (e instanceof AiScriptError) {
		console.log(chalk.red(`${e}`));
	} else {
		throw e
	}
}
