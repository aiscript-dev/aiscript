import { readdir } from 'node:fs/promises';

await readdir('./unreleased')
	.then(pathes => {
		if (pathes.length > 1 || (pathes.length === 1 && pathes[0] !== '.gitkeep')) throw new Error('Run "npm run pre-release" before publish.')
	}, err => {
		if (err.code !== 'ENOENT') throw err;
	});
