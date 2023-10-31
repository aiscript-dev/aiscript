import * as readline from 'readline/promises';
import chalk from 'chalk';
import { Parser, Interpreter, utils } from '@syuilo/aiscript';
const { valToString } = utils;

const i = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

console.log(
`Welcome to AiScript!
https://github.com/syuilo/aiscript

Type 'exit' to end this session.`);

const getInterpreter = () => new Interpreter({}, {
	in(q) {
		return i.question(q + ': ');
	},
	out(value) {
		if (value.type === 'str') {
			console.log(chalk.magenta(value.value));
		} else {
			console.log(chalk.magenta(valToString(value)));
		}
	},
	err(e) {
		console.log(chalk.red(`${e}`));
	},
	log(type, params) {
		switch (type) {
			case 'end': console.log(chalk.gray(`< ${valToString(params.val, true)}`)); break;
			default: break;
		}
	}
});

let interpreter;
async function main(){
	let a = await i.question('> ');
	interpreter?.abort();
	if (a === 'exit') return false;
	try {
		let ast = Parser.parse(a);
		interpreter = getInterpreter();
		await interpreter.exec(ast);
	} catch(e) {
		console.log(chalk.red(`${e}`));
	}
	return true;
};

while (await main());
i.close();
