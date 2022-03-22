<div class="root" data-example>
	<div class="container" data-example-container>
		<div class="preview-wrapper" data-example-preview-wrapper>
			<div class="preview" data-example-preview>
				<slot name="preview" />
			</div>
		</div>
		<pre data-example-code class="language-svelte"><slot name="code" /></pre>
	</div>
</div>

<style>
	.root {
		margin: 0.5rem 0;
	}

	.container {
		display: flex;
		flex-direction: column;
		width: 100%;
		overflow: hidden;
		border-bottom-left-radius: var(--preview-border-radius, 0.25rem);
		border-bottom-right-radius: var(--preview-border-radius, 0.25rem);
	}

	.preview-wrapper {
		display: flex;
		justify-content: center;
		background: var(--preview-background, #fafafa);
		border: var(--preview-border, 1px solid #ddd);
		overflow: hidden;
		border-bottom: none;
		border-top-left-radius: var(--preview-border-radius, 0.25rem);
		border-top-right-radius: var(--preview-border-radius, 0.25rem);
	}

	.preview {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0.75rem 0;
		min-height: 3rem;
	}

	pre {
		margin: 0;
	}
</style>
