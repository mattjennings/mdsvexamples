import { defineMDSveXConfig as defineConfig } from 'mdsvex';
import codePreview from './src/lib/remark.js';

const config = defineConfig({
	extensions: ['.svelte.md', '.md', '.svx'],

	smartypants: {
		dashes: 'oldschool'
	},

	remarkPlugins: [codePreview],
	rehypePlugins: []
});

export default config;
