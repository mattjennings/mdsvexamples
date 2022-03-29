import { visit } from 'unist-util-visit'
import path from 'upath'
import { fileURLToPath } from 'url'
import Prism from 'prismjs'
import 'prism-svelte'
import { escape } from './util.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// regex to find <script> block in svelte
const RE_SCRIPT_START =
	/<script(?:\s+?[a-zA-z]+(=(?:["']){0,1}[a-zA-Z0-9]+(?:["']){0,1}){0,1})*\s*?>/

export const EXAMPLE_MODULE_PREFIX = '___mdsvexample___'
export const EXAMPLE_COMPONENT_PREFIX = 'Mdsvexample___'

export default function (options = {}) {
	const { ExampleComponent = path.resolve(__dirname, 'Example.svelte') } = options

	return function transformer(tree) {
		let examples = []

		visit(tree, 'code', (node) => {
			const languages = ['svelte', 'html']
			const meta = parseMeta(node.meta || '')
			const { csr, example } = meta

			// find svelte code blocks with meta to trigger example
			if (example && languages.includes(node.lang)) {
				// add a comment so we can mark where the src is for each example
				// this is then searched for in plugin.js to create virtual files using this as the file content
				const src = `String.raw\`${escape(node.value)}\``

				examples.push({ csr })

				// generate the highlighted code
				const highlighted = Prism.highlight(node.value, Prism.languages.svelte, 'svelte')

				const mdsvexampleComponentName = `${EXAMPLE_COMPONENT_PREFIX}${examples.length - 1}`

				// convert markdown type to svelte syntax, where mdsvex will parse
				node.type = 'paragaph'
				node.children = [
					{
						type: 'text',
						value: `<Example __mdsvexample_src={${src}} meta={${JSON.stringify(meta)}}>
									<slot slot="example">${
										csr
											? `
											{#if typeof window !== 'undefined'}
												{#await import("${EXAMPLE_MODULE_PREFIX}${examples.length - 1}.svelte") then module}
													{@const ${mdsvexampleComponentName} = module.default}
													<${mdsvexampleComponentName} />
												{/await}
											{/if}`
											: `<${mdsvexampleComponentName} />`
									}</slot>
									<slot slot="code">{@html ${JSON.stringify(highlighted)}}</slot>
								</Example>`
					}
				]
				delete node.lang
				delete node.meta
				delete node.value
			}
		})

		// add imports for each generated example
		let scripts = `import Example from "${ExampleComponent}";\n`
		examples.forEach((example, i) => {
			if (!example.csr) {
				scripts += `import ${EXAMPLE_COMPONENT_PREFIX}${i} from "${EXAMPLE_MODULE_PREFIX}${i}.svelte";\n`
			}
		})

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

export function parseMeta(meta) {
	const options = {}
	const meta_parts = meta.split(' ')

	for (let i = 0; i < meta_parts.length; i++) {
		const [key, value] = meta_parts[i].split('=')

		options[key] = value === 'false' ? false : true
	}

	return options
}
