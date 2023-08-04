import { visit } from 'unist-util-visit'
import path from 'upath'
import { fileURLToPath } from 'url'
import Prism from 'prismjs'
import 'prism-svelte'
import { escape } from './util.js'

const _dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url))

// regex to find <script> block in svelte
const RE_SCRIPT_START =
  /<script(?:\s+?[a-zA-z]+(=(?:["']){0,1}[a-zA-Z0-9]+(?:["']){0,1}){0,1})*\s*?>/
const RE_SCRIPT_BLOCK = /(<script[\s\S]*?>)([\s\S]*?)(<\/script>)/g
const RE_STYLE_BLOCK = /(<style[\s\S]*?>)([\s\S]*?)(<\/style>)/g

// parses key=value pairs from a string. supports strings, numbers, booleans, and arrays
const RE_PARSE_META = /(\w+=\d+|\w+="[^"]*"|\w+=\[[^\]]*\]|\w+)/g

export const EXAMPLE_MODULE_PREFIX = '___mdsvexample___'
export const EXAMPLE_COMPONENT_PREFIX = 'Mdsvexample___'

export default function (options = {}) {
  const { defaults = {} } = options

  // legacy
  if (options.ExampleComponent) {
    defaults.Wrapper = options.ExampleComponent
    console.warn(`ExampleComponent is deprecated, use defaults.Wrapper instead`)
  }

  return function transformer(tree, file) {
    let examples = []

    const filename = toPOSIX(file.filename).split(toPOSIX(file.cwd)).pop()

    visit(tree, 'code', (node) => {
      const languages = ['svelte', 'html']
      /**
       * @type {Record<string, any>}
       */
      const meta = {
        Wrapper: path.resolve(_dirname, 'Example.svelte'),
        filename,
        ...defaults,
        ...parseMeta(node.meta || '')
      }

      const { csr, example, Wrapper } = meta

      // find svelte code blocks with meta to trigger example
      if (example && languages.includes(node.lang)) {
        const value = createExampleComponent(node.value, meta, examples.length)
        examples.push({ csr, Wrapper: meta.Wrapper || Wrapper })

        node.type = 'paragaph'
        node.children = [
          {
            type: 'text',
            value
          }
        ]
        delete node.lang
        delete node.meta
        delete node.value
      }
    })

    // add imports for each generated example
    let scripts = ''
    examples.forEach((example, i) => {
      const imp =
        typeof example.Wrapper === 'string'
          ? `import Example from "${example.Wrapper}";\n`
          : `import { ${example.Wrapper[1]} as Example } from "${example.Wrapper[0]}";\n`

      if (!scripts.includes(imp)) {
        scripts += imp
      }

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

function parseMeta(meta) {
  const result = {}
  const meta_parts = meta.match(RE_PARSE_META) ?? []

  for (let i = 0; i < meta_parts.length; i++) {
    const [key, value = 'true'] = meta_parts[i].split('=')

    try {
      result[key] = JSON.parse(value)
    } catch (e) {
      const error = new Error(`Unable to parse meta \`${key}=${value}\` - ${e.message}`)
      error.stack = e.stack
      throw error
    }
  }

  return result
}

function formatCode(code, meta) {
  if (meta.hideScript) {
    code = code.replace(RE_SCRIPT_BLOCK, '')
  }

  if (meta.hideStyle) {
    code = code.replace(RE_STYLE_BLOCK, '')
  }

  // remove leading/trailing whitespace and line breaks
  return code.replace(/^\s+|\s+$/g, '')
}

function createExampleComponent(value, meta, index) {
  const mdsvexampleComponentName = `${EXAMPLE_COMPONENT_PREFIX}${index}`

  const code = formatCode(value, meta)
  const highlighted = Prism.highlight(code, Prism.languages.svelte, 'svelte')

  const props = {
    // gets parsed as virtual file content in vite plugin and then removed
    __mdsvexample_src: `String.raw\`${escape(value)}\``,
    src: `String.raw\`${escape(code)}\``,
    meta: escape(JSON.stringify(meta))
  }

  return `<Example 
						__mdsvexample_src={${props.__mdsvexample_src}} 
						src={${props.src}} 
						meta={${props.meta}}
					>
						<slot slot="example">${
              meta.csr
                ? `
								{#if typeof window !== 'undefined'}
									{#await import("${EXAMPLE_MODULE_PREFIX}${index}.svelte") then module}
										{@const ${mdsvexampleComponentName} = module.default}
										<${mdsvexampleComponentName} />
									{/await}
								{/if}`
                : `<${mdsvexampleComponentName} />`
            }</slot>
						<slot slot="code">{@html ${JSON.stringify(highlighted)}}</slot>
			</Example>`
}

function toPOSIX(path) {
  return path.replace(/\\/g, '/')
}
