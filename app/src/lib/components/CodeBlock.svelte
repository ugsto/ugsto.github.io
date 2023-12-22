<script lang="ts">
	import CopyIcon from 'virtual:icons/mdi/content-copy';

	import hljs from 'highlight.js';
	import { copyToClipboard } from '$lib/utils/copyToClipboard';
	import { writable } from 'svelte/store';

	export let lang: string;
	export let text: string;

	const validLanguage = hljs.getLanguage(lang) ? lang : 'plaintext';
	const highlightedCode = hljs.highlight(text, { language: validLanguage }).value;

	const copied = writable<boolean | undefined>(undefined);

	async function onCopy(content: string) {
		const success = await copyToClipboard(content);

		copied.set(success);

		setTimeout(() => {
			copied.set(undefined);
		}, 2000);
	}
</script>

<div class="relative group">
	<div
		class=" hidden group-hover:flex gap-2 absolute top-1 right-1 pointer-events-none"
		aria-hidden="true"
	>
		{#if $copied !== undefined}
			<span class="text-xs">{$copied ? 'Copied!' : 'Error'}</span>
		{/if}
		{validLanguage}
		<button class="btn btn-ghost btn-xs pointer-events-auto" on:click={() => onCopy(text)}
			><CopyIcon /></button
		>
	</div>
	<pre><code class={validLanguage}>{@html highlightedCode}</code></pre>
</div>
