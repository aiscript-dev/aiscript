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
		if (value.type === 'str') {
			console.log(chalk.magenta(value.value));
		} else {
			console.log(chalk.magenta(valToString(value)));
		}
	},
	log(type, params) {
		switch (type) {
			case 'end': console.log(`< ${valToString(params.val)}`); break;
			default: break;
		}
	}
});

function main() {
	i.question('> ', async a => {
		await aiscript.exec(parse(a));
		main();
	});
}

main();
