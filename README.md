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

## Customization

Examples can take various configurations. The defaults for all can be set in the remark plugin, but you can
also provide them per-example as "meta" tags in the code block.

```js
{
  remarkPlugins: [
    [
      examples,
      {
        defaults: {
          foo: true,
          bar: 'baz'
        }
      }
    ]
  ]
}
```

````
```svelte example foo bar="baz"

...

```
````

### Wrapper

Example code blocks are rendered with a [Svelte component](./src/lib/Example.svelte). You can provide your own if you wish to customize its look or behaviour.

```js
{
  remarkPlugins: [
    [
      examples,
      {
        defaults: {
          Wrapper: '/src/lib/Example.svelte',

          // or if the component is a named export
          Wrapper: ['some-package', 'CustomExample'] // -> import { CustomExample } from 'some-package'
        }
      }
    ]
  ]
}
```

When provided as code block meta, it can be relative to the file

````
```svelte example Wrapper="./Example.svelte"

...

```
````

```html
<!-- src/lib/Example.svelte -->
<script>
  // the source of the example, if you want it
  export let src

  // all meta tags of the code block
  export let meta
</script>

<div class="example">
  <slot name="example" />
</div>
<div class="code">
  <pre class="language-svelte"><slot name="code" /></pre>
</div>
```

### csr

Forces the example to only be imported & rendered client-side. This is useful for examples that consume
libraries that may have issues server-side.

````
```svelte example csr
<script>
  import BrowserOnlyComponent from '../lib/BrowserOnlyComponent.svelte'
</script>

<BrowserOnlyComponent />
```
````

### hideScript

Hides `<script>` tags from being shown in the displayed code. This will also remove it from
the `src` prop if you have a custom Example component.

````
```svelte example hideScript
<script>
  console.log("Hello World!")
</script>

<button>Button</button>
```
````

### hideStyle

Hides `<style>` tags from being shown in the displayed code. This will also remove it from
the `src` prop if you have a custom Example component.

````
```svelte example hideStyle
<button>Button</button>

<style>
  button {
    background: green;
  }
</style>
```
````
