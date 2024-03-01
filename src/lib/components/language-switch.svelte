<script>
	import { locale } from '$lib/translations';
	import UsFlag from 'virtual:icons/circle-flags/us';
	import BrFlag from 'virtual:icons/circle-flags/br';

	let detailsIsOpen = false;
	/**
	 * @type {Record<string, any>}
	 */
	const flagByLanguage = {
		en: UsFlag,
		br: BrFlag
	};

	function closeDetails() {
		detailsIsOpen = false;
	}

	closeDetails();
</script>

<details class="relative inline-block group" bind:open={detailsIsOpen}>
	<summary
		class="relative inline-flex items-center justify-center rounded group-open:rounded-b-none bg-slate-4 hover:bg-slate-5 dark:bg-slate-d4 dark:hover:bg-slate-d5 px-2 py-1 text-slate-12 dark:text-slate-d12 peer select-none cursor-pointer"
		aria-haspopup="true"
	>
		<div class="flex gap-2 items-center">
			<svelte:component this={flagByLanguage[$locale]} />
			{$locale}
		</div>
		<img
			src="/arrow-down.svg"
			alt="Arrow pointing down"
			class="w-5 ml-2 -mr-1 -mb-0.5 dark:invert"
			style="font-size: 0"
		/>
	</summary>

	<ul
		class="absolute right-0 py-2 w-56 bg-slate-4 dark:bg-slate-d4 rounded-b rounded-l shadow-lg text-slate-12 dark:text-slate-d12 text-sm z-10"
		role="menu"
		aria-orientation="vertical"
	>
		<li>
			<a
				href="/en.html"
				class="block px-4 py-2 hover:bg-slate-a5 dark:hover:bg-slate-da5"
				role="menuitem"
				data-sveltekit-preload-data="off"
				on:click={closeDetails}>English</a
			>
		</li>
		<li>
			<a
				href="/br.html"
				class="block px-4 py-2 hover:bg-slate-a5 dark:hover:bg-slate-da5"
				role="menuitem"
				data-sveltekit-preload-data="off"
				on:click={closeDetails}>Português (Brasil)</a
			>
		</li>
	</ul>
</details>
