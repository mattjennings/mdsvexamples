import { defineMDSveXConfig as defineConfig } from 'mdsvex'
import examples from './src/lib/remark.js'

const config = defineConfig({
	extensions: ['.svelte.md', '.md', '.svx'],

	smartypants: {
		dashes: 'oldschool'
	},

	remarkPlugins: [examples],
	rehypePlugins: []
})

export default config
