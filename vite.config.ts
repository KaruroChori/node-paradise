import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		minify: false,
		rollupOptions: {
			treeshake: false,
			plugins: [
				{
					name: 'no-treeshake',
					transform(_, id) {
						console.log('File', id);
						if (id.includes('litegraph.js')) {
							console.log('found!!!!!!!!!!!!!!!!!!!!!!!!!');
							return { moduleSideEffects: 'no-treeshake' };
						}
					}
				},
				commonjs({ transformMixedEsModules: true }),
				resolve(),
				{
					name: 'hello',
					transform() {
						//throw 'EEEE';
					}
				}
			]
		}
	}
});
