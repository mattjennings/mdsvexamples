import { createUnplugin } from 'unplugin';
import { EXAMPLE_MODULE_PREFIX, EXAMPLE_COMPONENT_PREFIX } from './remark.js';
import path from 'path';
import MagicString from 'magic-string';
import { parseSrc } from './util.js';

const RE_SRC = new RegExp(
	`src:\\s?String\\.raw\`(<!-- ${EXAMPLE_COMPONENT_PREFIX}(\\d) -->\\n)([\\s\\S*]*?)\\n<!-- ${EXAMPLE_COMPONENT_PREFIX}(\\d) -->`,
	'g'
);

export default createUnplugin(
	(
		/**
		 * @type {{ extensions?: string[]}}
		 */
		options = {}
	) => {
		const { extensions = ['.svelte.md', '.md', '.svx'] } = options;
		const examples = {};

		let viteServer;

		return {
			name: 'mdsvex-code-preview-plugin',
			transformInclude(id) {
				return extensions.some((ext) => id.endsWith(ext));
			},
			resolveId(id) {
				if (id.includes(EXAMPLE_MODULE_PREFIX)) {
					return id;
				}
			},
			load(id) {
				if (id.includes(EXAMPLE_MODULE_PREFIX)) {
					if (examples[id]) {
						const code = examples[id];
						return code;
					}

					throw new Error(`Example src not found for ${id}`);
				}
			},
			transform(code, id) {
				const matches = code.matchAll(RE_SRC);

				/** @type {any} */
				const s = new MagicString(code);

				for (const [, comment, i, src] of matches) {
					// change path of module so that it's sibling to the mdsvex file
					const base = path.relative(process.cwd(), id);
					const importPath = `${base}/${EXAMPLE_MODULE_PREFIX}${i}.svelte`;

					examples[importPath] = parseSrc(src);

					s
						// update import path
						.replace(`${EXAMPLE_MODULE_PREFIX}${i}.svelte`, importPath)
						// remove comment used to mark where code is
						.replace(comment, '');
				}

				return { code: s.toString(), map: s.generateMap() };
			},

			vite: {
				configureServer(server) {
					viteServer = server;
				},
				handleHotUpdate() {
					// reload page when example is updated - would be nice to trigger HMR on owner svelte component instead
					Object.keys(examples).forEach((key) => {
						viteServer.moduleGraph.invalidateModule(viteServer.moduleGraph.getModuleById(key));
						viteServer.ws.send({
							type: 'full-reload'
						});
					});
				}
			}
		};
	}
);
