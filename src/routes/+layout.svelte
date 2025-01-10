<script>
  import '../app.css'
  import '$lib/themes/dark.css'
  /**
   * @typedef {Object} Props
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { children } = $props();
</script>

{@render children?.()}
