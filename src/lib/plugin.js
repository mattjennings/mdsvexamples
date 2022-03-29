import { createUnplugin } from 'unplugin'
import { EXAMPLE_MODULE_PREFIX } from './remark.js'
import path from 'upath'
import { unescape } from './util.js'
import ast from 'abstract-syntax-tree'

/**
 * Extracted examples as individual virtual files
 *
 * @type {Map<string, string>}
 */
const virtualFiles = new Map()

export default createUnplugin(
	(
		/**
		 * @type {{ extensions?: string[]}}
		 */
		options = {}
	) => {
		const { extensions = ['.svelte.md', '.md', '.svx'] } = options

		return {
			name: 'mdsvexamples-plugin',
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
					if (virtualFiles.has(id)) {
						const code = virtualFiles.get(id)
						return code
					} else {
						this.warn(`Example src not found for ${id}`)
					}
				}
			},
			transform(code, id) {
				if (extensions.some((ext) => id.endsWith(ext))) {
					updateExample(id, code)

					const tree = ast.parse(code)

					iterateMdsvexSrcNodes(tree, (srcNode, valueNode, i) => {
						// rename the __mdsvexample_src prop to src
						ast.replace(tree, (node) => {
							if (node === srcNode) {
								srcNode.key.name = 'src'
							}
						})

						// update the import path
						ast.replace(tree, (node) => {
							if (
								(node.type === 'ImportDeclaration' || node.type === 'ImportExpression') &&
								node.source.value === `${EXAMPLE_MODULE_PREFIX}${i}.svelte`
							) {
								const fileName = `${EXAMPLE_MODULE_PREFIX}${i}.svelte`
								const importPath = path.resolve(process.cwd(), id + fileName)
								node.source.value = importPath
							}
							return node
						})
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
				async handleHotUpdate(ctx) {
					const { server } = ctx
					const modules = []

					const files = [...virtualFiles.entries()]

					// update the examples that are included in the updated file
					if (extensions.some((ext) => ctx.file.endsWith(ext))) {
						files
							.map(([id]) => ({
								id,
								parent: id.split(EXAMPLE_MODULE_PREFIX)[0]
							}))
							.filter((file) => ctx.file.endsWith(file.parent))
							.forEach((file) => {
								modules.push(server.moduleGraph.getModuleById(file.id))
								virtualFiles.set(file.id, null)
							})
					}
					return [...modules, ...ctx.modules]
				}
			}
		}
	}
)

/**
 * Updates the example in the virtual file cache
 *
 * @param {string} id
 * @param {string} code
 */
function updateExample(id, code) {
	const tree = ast.parse(code)

	iterateMdsvexSrcNodes(tree, (srcNode, valueNode, i) => {
		const exampleId = `${EXAMPLE_MODULE_PREFIX}${i}.svelte`
		const virtualId = path.join('/', path.relative(process.cwd(), id + exampleId))

		// store example code
		virtualFiles.set(virtualId, unescape(valueNode.value.raw))
	})
}

/**
 * Iterates over each __mdsvexample_src node in generated svelte file
 *
 * @param {any} tree
 * @param {(srcNode: any, valueNode: any, index: number) => void} cb
 */
function iterateMdsvexSrcNodes(tree, cb) {
	const exampleSrcNodes = ast.find(tree, {
		type: 'Property',
		key: {
			name: '__mdsvexample_src'
		}
	})

	exampleSrcNodes.map((node, i) => {
		const [valueNode] = ast.find(node, {
			type: 'TemplateElement'
		})

		if (valueNode) {
			cb(node, valueNode, i)
		}
	})
}
