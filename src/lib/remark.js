import { visit } from 'unist-util-visit'
import path from 'path'
import { fileURLToPath } from 'url'
import Prism from 'prismjs'
import 'prism-svelte'
import { escape } from './util.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// regex to find <script> block in svelte
const RE_SCRIPT_START =
	/<script(?:\s+?[a-zA-z]+(=(?:["']){0,1}[a-zA-Z0-9]+(?:["']){0,1}){0,1})*\s*?>/

export const EXAMPLE_MODULE_PREFIX = '___mdsvex_example___'
export const EXAMPLE_COMPONENT_PREFIX = 'MdsvexExample___'

export default function (options = {}) {
	const { ExampleComponent = path.resolve(__dirname, 'Example.svelte') } = options

	return function transformer(tree) {
		let examples = 0

		visit(tree, 'code', (node) => {
			// find svelte code blocks with meta to trigger example
			if (node.lang === 'svelte' && node.meta && node.meta.includes('example')) {
				// add a comment so we can mark where the src is for each example
				// this is then searched for in plugin.js to create virtual files using this as the file content
				const src =
					`/* ${EXAMPLE_COMPONENT_PREFIX}${examples} */` + `String.raw\`${escape(node.value)}\``

				// generate the highlighted code
				const highlighted = Prism.highlight(node.value, Prism.languages.svelte, 'svelte')

				// convert markdown type to svelte syntax, where mdsvex will parse
				node.type = 'paragaph'
				node.children = [
					{
						type: 'text',
						value: `<Example src={${src}}>
	<slot slot="example"><${EXAMPLE_COMPONENT_PREFIX}${examples} /></slot>
	<slot slot="code">{@html ${JSON.stringify(highlighted)}}</slot>
</Example>`
					}
				]
				delete node.lang
				delete node.meta
				delete node.value
				examples += 1
			}
		})

		// add imports for each generated example
		let scripts = `import Example from "${ExampleComponent}";\n`
		for (let i = 0; i < examples; i++) {
			scripts += `import ${EXAMPLE_COMPONENT_PREFIX}${i} from "${EXAMPLE_MODULE_PREFIX}${i}.svelte";\n`
		}

		let is_script = false

		// add scripts to script block
		visit(tree, 'html', (node) => {
			if (RE_SCRIPT_START.test(node.value)) {
				is_script = true
				node.value = node.value.replace(RE_SCRIPT_START, (script) => {
					return `${script}\n${scripts}`
				})
			}
		})

		// create script block if needed
		if (!is_script) {
			tree.children.push({
				type: 'html',
				value: `<script>\n${scripts}</script>`
			})
		}
	}
}
