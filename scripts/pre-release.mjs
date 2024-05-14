import { readFile, readdir, writeFile, mkdir, rm } from 'node:fs/promises';
import { env } from 'node:process';
import semverValid from 'semver/functions/valid.js';


function validateEnv(name, validater) {
	let val = env[name];
	if (!val) throw new Error(`$${name} required`);
	if (!validater(val)) throw new Error(`${val} is not valid as $${name}`);
	return val;
}
/*
 * Required Environment Variables
 */
const e = {
	newver: validateEnv("NEWVERSION", v => semverValid(v)),
};


const FILES = {
	chlog: './CHANGELOG.md',
	chlogs: './unreleased',
	pkgjson: './package.json',
};
const enc = { encoding: env.ENCODING ?? 'utf8' };
const actions = {};

/*
 * Update package.json's version field
 */
actions.updatePackageJson = {
	async read() {
		const json = await readFile(FILES.pkgjson, enc);
		return JSON.stringify(
			{ ...JSON.parse(json), version: e.newver },
			null, '\t'
		);
	},
	async write(json) {
		return writeFile(FILES.pkgjson, json);
	},
};

/*
 * Collect changelogs
 */
actions.collectChangeLogs = {
	async read() {
		const getNewLog = async () => {
			const pathes = await readdir(FILES.chlogs);
			const logPromises = pathes.map(path => readFile(`${FILES.chlogs}/${path}`, enc));
			const logs = await Promise.all(logPromises);
			return logs.map(v => v.trim()).join('\n');
		};
		const getOldLog = async () => {
			const log = await readFile(FILES.chlog, enc);
			const idx = log.indexOf('#');
			return [
				log.slice(0, idx),
				log.slice(idx),
			];
		};
		const [newLog, [logHead, oldLog]] = await Promise.all([ getNewLog(), getOldLog() ]);
		return `${logHead}# ${e.newver}\n${newLog}\n\n${oldLog}`;

	},
	async write(logs) {
		return Promise.all([
			writeFile(FILES.chlog, logs),
			rm(FILES.chlogs, {
				recursive: true,
				force: true,
			}).then(() =>
				mkdir(FILES.chlogs)
			).then(() =>
				writeFile(`${FILES.chlogs}/.gitkeep`, ''))
		]);
	},
};

// read all before writing
const reads = await Promise.all(Object.entries(actions).map(async ([name, { read }]) => [name, await read().catch(err => { throw new Error(`in actions.${name}.read: ${err}`) })]));

// write after reading all
await Promise.all(reads.map(([name, read]) => actions[name].write(read).catch(err => { throw new Error(`in actions.${name}.write: ${err}`) })));

