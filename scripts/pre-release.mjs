import { readFile, readdir, writeFile, mkdir, rm } from 'node:fs/promises';
import { env } from 'node:process';
import { promisify } from 'node:util';
import child_process from 'node:child_process';
import semverValid from 'semver/functions/valid.js';


const exec = promisify(child_process.exec);
const FILES = {
	chlog: './CHANGELOG.md',
	chlogs: './unreleased',
	pkgjson: './package.json',
};
const enc = { encoding: env.ENCODING ?? 'utf8' };
const pkgjson = JSON.parse(await readFile(FILES.pkgjson, enc));
const newver = (() => {
	const newverCandidates = [
		[env.NEWVERSION, 'Environment variable NEWVERSION'],
		[pkgjson.version, "Package.json's version field"],
	];
	for (const [ver, name] of newverCandidates) {
		if (ver) {
			if (semverValid(ver)) return ver;
			else throw new Error(`${name} is set to "${ver}"; it is not valid`);
		}
	}
	throw new Error('No effective version setting detected.');
})();
const actions = {};

/*
 * Update package.json's version field
 */
actions.updatePackageJson = {
	async read() {
		return JSON.stringify(
			{ ...pkgjson, version: newver },
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
			const pathes = (await readdir(FILES.chlogs)).map(path => `${FILES.chlogs}/${path}`);
			const pathesLastUpdate = await Promise.all(
				pathes.map(async (path) => {
					const gittime = Number((await exec(
						`git log -1 --pretty="format:%ct" "${path}"`
					)).stdout);
					if (gittime) return { path, lastUpdate: gittime };
					else {
						console.log(`Warning: git timestamp of "${path}" was not detected`);
						return { path, lastUpdate: Infinity }
					}
				})
			);
			pathesLastUpdate.sort((a, b) => a.lastUpdate - b.lastUpdate);
			const logPromises = pathesLastUpdate.map(({ path }) => readFile(path, enc));
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
		return `${logHead}# ${newver}\n${newLog}\n\n${oldLog}`;

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

