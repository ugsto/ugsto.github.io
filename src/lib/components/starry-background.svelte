<script>
	import './stars.css';
	import init, { randomStars, plotStars } from '$lib/wasm/starry_background/pkg/starry_background';
	import { onMount } from 'svelte';

	/**
	 * @type {string}
	 */
	export let id;

	onMount(() => {
		init().then(() => {
			plotStars(randomStars(50), document.getElementById('sky'));
		});
	});
</script>

<div
	{id}
	class="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-sky-9 dark:bg-sky-d1"
	aria-hidden="true"
/>
