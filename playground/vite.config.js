import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync } from 'fs';

const data = JSON.parse(readFileSync('../tsconfig.json', 'utf8'));

let target = data.compilerOptions.target;

// https://vitejs.dev/config/
export default defineConfig({
	base: './',
  plugins: [vue()],
	server: {
		fs: {
			allow: [ '..' ]
		}
	},
	build: {
		target: target
	},
})
