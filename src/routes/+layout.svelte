<script lang="ts">
	import "./layout.css";
	import favicon from "$lib/assets/favicon.svg";
	import {
		extractLocaleFromUrl,
		getLocale,
		setLocale,
	} from "$lib/paraglide/runtime";
	import { page } from "$app/state";

	let { children } = $props();
	$effect(() => {
		const currentUrl = page.url;
		const locale = extractLocaleFromUrl(currentUrl) ?? getLocale();
		setLocale(locale);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
