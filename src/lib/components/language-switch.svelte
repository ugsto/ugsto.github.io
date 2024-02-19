<script lang="ts">
	import { locale } from '$lib/translations';
	import { flag } from '$lib/translations/flag';

	let currentFlag = '';

	function updateFlag(lang: string) {
		const langKey = lang as keyof typeof flag;
		if (!flag[langKey]) {
			return;
		}

		currentFlag = flag[langKey];
	}

	updateFlag($locale);
</script>

<div class="relative inline-block">
	<button
		class="relative inline-flex justify-center rounded hover:rounded-b-none bg-slate-a4 hover:bg-slate-a5 dark:bg-slate-da4 dark:hover:bg-slate-da5 pl-4 pr-3 py-1 text-slate-12 dark:text-slate-d12 peer select-none"
		aria-label="Language switch hover trigger"
		aria-haspopup="true"
		tabindex="0"
	>
		{currentFlag} - {$locale}
		<img
			src="/arrow-down.svg"
			alt="Arrow pointing down"
			class="w-5 ml-2 -mr-1 -mb-0.5 dark:invert"
			style="font-size: 0"
		/>
	</button>

	<ul
		role="menu"
		class="absolute right-0 pt-2 w-56 bg-slate-4 dark:bg-slate-d4 rounded-b rounded-l shadow-lg focus:outline-none text-slate-12 dark:text-slate-d12 text-sm hidden peer-hover:block peer-focus:block hover:block focus:block"
		aria-orientation="vertical"
		aria-labelledby="menu-button"
	>
		<li>
			<a
				href="/en"
				data-sveltekit-preload-data="off"
				class="block px-4 py-2 hover:bg-slate-a5 dark:hover:bg-slate-da5"
				role="menuitem"
				tabindex="0"
				on:click={() => updateFlag('en')}>English</a
			>
		</li>
		<li>
			<a
				href="/br"
				data-sveltekit-preload-data="off"
				class="block px-4 py-2 hover:bg-slate-a5 dark:hover:bg-slate-da5"
				role="menuitem"
				tabindex="0"
				on:click={() => updateFlag('br')}>Português (Brasil)</a
			>
		</li>
	</ul>
</div>
