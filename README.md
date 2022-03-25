# mdsvexamples

Render your Svelte code blocks in MDSveX

````
# Button

An example of how to use our Button component

```svelte example
<script>
    import Button from '$lib/Button.svelte'
</script>

<Button>Button</Button>
```
````

![preview](https://i.imgur.com/i1O2uot.png)

## Getting Started

```bash
npm install mdsvexamples
```

## Setup

There are two plugins that you need to add: a remark plugin and a vite plugin.

There are plugins provided for esbuild and rollup as well, as it uses [unplugin](https://github.com/unjs/unplugin), but I have not tested these so YMMV

### MDSveX

Add the remark plugin to your MDSveX config

```js
// mdsvex.config.js
import { defineMDSveXConfig as defineConfig } from 'mdsvex'
import examples from 'mdsvexamples'

const config = defineConfig({
	extensions: ['.svelte.md', '.md', '.svx'],

	smartypants: {
		dashes: 'oldschool'
	},

	remarkPlugins: [examples],
	rehypePlugins: []
})

export default config
```

### Vite

Add the vite plugin to your vite config

```js
// vite.config.js
import { defineConfig } from 'vite'
import examples from 'mdsvexamples/vite'

export default defineConfig({
	plugins: [examples]
})

// or svelte.config.js if you're using SvelteKit
import examples from 'mdsvexamples/vite'

const config = {
	kit: {
		/* ... */

		vite: {
			plugins: [examples]
		}
	},
}

export default config

```

## Usage

Add `example` to your Svelte code block and it will be rendered

````
```svelte example
<button>Button</button>
```
````

Imports also work!

````
```svelte example
<script>
	import Button from '../lib/Button.svelte'
</script>

<Button>Button</Button>
```
````

## Options

### csr

Examples with `csr` will only be imported & rendered client-side. This is useful for examples that consume
libraries that may have issues server-side.

````
```svelte example csr
<script>
	import BrowserOnlyComponent from '../lib/BrowserOnlyComponent.svelte'
</script>

<BrowserOnlyComponent />
```
````

## Customization

### Example component

Examples (and the code block) are rendered with a [Svelte component](./src/lib/Example.svelte). You can provide your own if you wish to customize its look.

```js
import { defineMDSveXConfig as defineConfig } from 'mdsvex'
import examples from 'mdsvexamples'

const config = defineConfig({
	remarkPlugins: [[examples, { ExampleComponent: '/src/lib/Example.svelte' }]]
})

export default config
```

```svelte
<!-- src/lib/Example.svelte -->
<script>
	// the source of the example is provided as a prop if you want it
	export let src
</script>

<div class="example">
	<slot name="example" />
</div>
<div class="code">
	<pre class="language-svelte"><slot name="code" /></pre>
</div>
```
