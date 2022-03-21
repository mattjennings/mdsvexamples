<script>
	import Prism from 'prismjs';
	import 'prism-svelte';

	export let src;

	$: highlighted = Prism.highlight(src, Prism.languages.svelte, 'svelte');
</script>

<div class="mt-2">
	<div class="flex flex-col w-full overflow-hidden rounded mb-4 border shadow">
		<div class="flex justify-center py-3 bg-gray-100">
			<div class="overflow-hidden min-h-[3rem] flex align-center">
				<slot />
			</div>
		</div>
		<pre class="language-svelte !m-0">{@html highlighted}</pre>
	</div>
</div>
