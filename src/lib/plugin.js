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

		/**
		 * Extracted examples as individual virtual files
		 *
		 * @type {Map<string, { src: string, updated: number}>}
		 */
		const virtualFiles = new Map()

		/**
		 * @type {import('vite').ViteDevServer}
		 */
		let viteServer

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
						const code = virtualFiles.get(id).src
						return code
					} else {
						this.warn(`Example src not found for ${id}`)
					}
				}
			},

			transform(code, id) {
				if (extensions.some((ext) => id.endsWith(ext))) {
					const tree = ast.parse(code)
					const now = Date.now()

					iterateMdsvexSrcNodes(tree, (srcNode, valueNode, i) => {
						const exampleId = `${EXAMPLE_MODULE_PREFIX}${i}.svelte`
						const virtualId = path.join('/', path.relative(process.cwd(), id + exampleId))

						// update virtualFiles with code from example
						const prev = virtualFiles.get(virtualId) && virtualFiles.get(virtualId).src
						const next = unescape(valueNode.value.raw)

						if (next !== prev) {
							virtualFiles.set(virtualId, { src: next, updated: now })

							// invalidate module for hmr
							if (viteServer) {
								const mod = viteServer.moduleGraph.getModuleById(virtualId)
								const parentMod = viteServer.moduleGraph.getModuleById(id)
								if (mod) {
									viteServer.moduleGraph.invalidateModule(mod)
									viteServer.moduleGraph.invalidateModule(parentMod)
								}
							}
						}

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
				configureServer(server) {
					viteServer = server
				},
				async handleHotUpdate(ctx) {
					const { server } = ctx
					const modules = []

					// return virtual file modules for parent file
					if (extensions.some((ext) => ctx.file.endsWith(ext))) {
						const files = [...virtualFiles.entries()]

						files
							.map(([id, file]) => ({
								id,
								parent: id.split(EXAMPLE_MODULE_PREFIX)[0],
								updated: file.updated
							}))
							.filter((file) => {
								return ctx.file.endsWith(file.parent)
							})
							.forEach((file) => {
								const mod = server.moduleGraph.getModuleById(file.id)
								modules.push(mod)
							})
					}

					return [...ctx.modules, ...modules]
				}
			}
		}
	}
)
