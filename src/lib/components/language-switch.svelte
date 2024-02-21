<script lang="ts">
	import { locale } from '$lib/translations';
	import { flag } from '$lib/translations/flag';

	let currentFlag = '';
	let detailsIsOpen = false;

	function updateFlagAndCloseDetails(lang: string) {
		const langKey = lang as keyof typeof flag;
		if (!flag[langKey]) {
			return;
		}

		currentFlag = flag[langKey];
		detailsIsOpen = false;
	}

	updateFlagAndCloseDetails($locale);
</script>

<details class="relative inline-block group" bind:open={detailsIsOpen}>
	<summary
		class="relative inline-flex justify-center rounded group-open:rounded-b-none bg-slate-a4 dark:bg-slate-da4 pl-4 pr-3 py-1 text-slate-12 dark:text-slate-d12 peer select-none cursor-pointer"
		aria-haspopup="true"
	>
		{currentFlag} - {$locale}
		<img
			src="/arrow-down.svg"
			alt="Arrow pointing down"
			class="w-5 ml-2 -mr-1 -mb-0.5 dark:invert"
			style="font-size: 0"
		/>
	</summary>

	<ul
		class="absolute right-0 pt-2 w-56 bg-slate-4 dark:bg-slate-d4 rounded-b rounded-l shadow-lg text-slate-12 dark:text-slate-d12 text-sm z-10"
		role="menu"
		aria-orientation="vertical"
	>
		<li>
			<a
				href="/en"
				class="block px-4 py-2 hover:bg-slate-a5 dark:hover:bg-slate-da5"
				role="menuitem"
				data-sveltekit-preload-data="off"
				on:click={() => updateFlagAndCloseDetails('en')}>English</a
			>
		</li>
		<li>
			<a
				href="/br"
				class="block px-4 py-2 hover:bg-slate-a5 dark:hover:bg-slate-da5"
				role="menuitem"
				data-sveltekit-preload-data="off"
				on:click={() => updateFlagAndCloseDetails('br')}>Português (Brasil)</a
			>
		</li>
	</ul>
</details>
