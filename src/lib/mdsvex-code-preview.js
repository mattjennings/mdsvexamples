import { visit } from 'unist-util-visit';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RE_SCRIPT_START =
	/<script(?:\s+?[a-zA-z]+(=(?:["']){0,1}[a-zA-Z0-9]+(?:["']){0,1}){0,1})*\s*?>/;

const EXAMPLE_MODULE_PREFIX = '___mdsvex_example___';
const EXAMPLE_COMPONENT_PREFIX = 'MdsvexExample___';

export default function mdsvexPreview(options = {}) {
	const { ExampleComponent = path.resolve(__dirname, 'Example.svelte') } = options;

	return function transformer(tree) {
		const examples = [];

		visit(tree, 'code', (node) => {
			if (node.lang === 'svelte' && node.meta && node.meta.includes('preview')) {
				const src = JSON.stringify(node.value);

				examples.push(node.value);
				node.type = 'paragaph';
				node.children = [
					{
						type: 'text',
						value: `<Example src={${src}}><${EXAMPLE_COMPONENT_PREFIX}${
							examples.length - 1
						} src={String.raw\`${node.value}\`}/></Example>`
					}
				];
				delete node.lang;
				delete node.meta;
				delete node.value;
			}
		});

		let scripts = `import Example from "${ExampleComponent}";\n`;

		examples.forEach(
			(example, index) =>
				(scripts += `import ${EXAMPLE_COMPONENT_PREFIX}${index} from "${EXAMPLE_MODULE_PREFIX}${index}.svelte";\n`)
		);

		let is_script = false;

		visit(tree, 'html', (node) => {
			if (RE_SCRIPT_START.test(node.value)) {
				is_script = true;
				node.value = node.value.replace(RE_SCRIPT_START, (script) => {
					return `${script}\n${scripts}`;
				});
			}
		});

		if (!is_script) {
			tree.children.push({
				type: 'html',
				value: `<script>\n${scripts}</script>`
			});
		}
	};
}

export function mdsvexPreviewVite() {
	const examples = {};

	const RE_SRC = /new MdsvexExample___(\d)[\s\S][^`]*src:\s?String.raw`([\s\S]*?)`/g;

	/**
	 * @type {import('vite').ViteDevServer}
	 */
	let server;

	/**
	 * @type {import('vite').Plugin}
	 */
	const plugin = {
		name: 'docs-plugin',
		configureServer(_server) {
			server = _server;
		},
		resolveId(id) {
			if (id.startsWith(EXAMPLE_MODULE_PREFIX)) {
				return id;
			}
		},
		load(id) {
			if (id.startsWith(EXAMPLE_MODULE_PREFIX)) {
				if (examples[id]) {
					const code = examples[id].src;
					return code;
				}

				throw new Error(`Example src not found for ${id}`);
			}
		},
		transform(code, id) {
			if (id.includes('.svx')) {
				const matches = code.matchAll(RE_SRC);

				for (const [, i, src] of matches) {
					examples[`${EXAMPLE_MODULE_PREFIX}${i}.svelte`] = { owner: id, src };
				}
			}

			return { code, map: null };
		},
		handleHotUpdate() {
			// reload page when example is updated - would be nice to trigger HMR on owner svelte component instead
			Object.keys(examples).forEach((key) => {
				server.moduleGraph.invalidateModule(server.moduleGraph.getModuleById(key));
				server.ws.send({
					type: 'full-reload'
				});
			});
		}
	};
	return plugin;
}
