import { createUnplugin } from 'unplugin'
import { EXAMPLE_MODULE_PREFIX } from './remark.js'
import path from 'upath'
import { unescape } from './util.js'
import ast from 'abstract-syntax-tree'

export default createUnplugin(
	(
		/**
		 * @type {{ extensions?: string[]}}
		 */
		options = {}
	) => {
		const { extensions = ['.svelte.md', '.md', '.svx'] } = options
		const examples = {}

		let viteServer

		return {
			name: 'mdsvexample-plugin',
			transformInclude(id) {
				return extensions.some((ext) => id.endsWith(ext)) || id.includes(EXAMPLE_MODULE_PREFIX)
			},
			resolveId(id) {
				if (id.includes(EXAMPLE_MODULE_PREFIX)) {
					return id
				}
			},
			load(id) {
				if (id.includes(EXAMPLE_MODULE_PREFIX)) {
					if (examples[id]) {
						const code = examples[id]
						return code
					}

					throw new Error(`Example src not found for ${id}`)
				}
			},
			transform(code, id) {
				if (extensions.some((ext) => id.endsWith(ext))) {
					const tree = ast.parse(code)

					// find all __mdsvexample_src props
					const exampleSrcNodes = ast.find(tree, {
						type: 'Property',
						key: {
							name: '__mdsvexample_src'
						}
					})

					exampleSrcNodes.forEach((exampleSrcNode, i) => {
						const [valueNode] = ast.find(exampleSrcNode, {
							type: 'TemplateElement'
						})

						if (valueNode) {
							// change path of module so that it's a sibling to the mdsvex file
							const base = path.relative(process.cwd(), id)
							const importPath = `${base}${EXAMPLE_MODULE_PREFIX}${i}.svelte`

							// store example code
							examples[importPath] = unescape(valueNode.value.raw)

							// rename the __mdsvexample_src prop to src
							ast.replace(tree, (node) => {
								if (node === exampleSrcNode) {
									exampleSrcNode.key.name = 'src'
								}
							})

							// update the import path
							ast.replace(tree, (node) => {
								if (
									(node.type === 'ImportDeclaration' || node.type === 'ImportExpression') &&
									node.source.value === `${EXAMPLE_MODULE_PREFIX}${i}.svelte`
								) {
									node.source.value = importPath
								}
								return node
							})
						}
					})

					return {
						code: ast.generate(tree),
						/** @type {any} */
						map: {
							mappings: null
						}
					}
				}

				return {
					code,
					map: {
						mappings: null
					}
				}
			},

			vite: {
				configureServer(server) {
					viteServer = server
				},
				handleHotUpdate() {
					// reload page when example is updated - would be nice to trigger HMR on owner svelte component instead
					Object.keys(examples).forEach((key) => {
						viteServer.moduleGraph.invalidateModule(viteServer.moduleGraph.getModuleById(key))
						viteServer.ws.send({
							type: 'full-reload'
						})
					})
				}
			}
		}
	}
)
