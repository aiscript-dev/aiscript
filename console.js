const readline = require('readline');
const chalk = require('chalk');
const parse = require('./built/parser/index.js').parse;
const { valToString, nodeToString } = require('./built/interpreter/util.js');
const AiScript = require('./built/interpreter/index.js').AiScript;

const i = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

console.log('Welcome to AiScript!');
console.log('https://github.com/syuilo/aiscript\n');

const aiscript = new AiScript({}, {
	in(q) {
		return new Promise(ok => {
			i.question(q + ': ', ok);
		});
	},
	out(value) {
		if (value.type === 'str') {
			console.log(chalk.magenta(value.value));
		} else {
			console.log(chalk.magenta(valToString(value)));
		}
	},
	log(type, params) {
		switch (type) {
			case 'end': console.log(chalk.gray(`< ${valToString(params.val, true)}`)); break;
			default: break;
		}
	}
});

function main() {
	i.question('> ', async a => {
		let ast;
		try {
			ast = parse(a);
		} catch(e) {
			console.log(chalk.red(`Syntax Error!`));
			main();
			return;
		}

		try {
			await aiscript.exec(ast);
		} catch(e) {
			console.log(chalk.red(`${e}`));
			main();
			return;
		}

		main();
	});
}

main();
