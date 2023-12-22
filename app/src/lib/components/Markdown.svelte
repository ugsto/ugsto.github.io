<script lang="ts">
	import SvelteMarkdown from 'svelte-markdown';
	import 'highlight.js/styles/stackoverflow-dark.css';
	import CodeBlock from './CodeBlock.svelte';

	export let content: string;
</script>

<SvelteMarkdown source={content} renderers={{ code: CodeBlock }} />
