<script lang="ts">
	import LightBulbOffIcon from 'virtual:icons/mdi/weather-night';
	import LightBulbOnIcon from 'virtual:icons/mdi/weather-sunny';

	export let theme = 'light';

	function toggleTheme() {
		if (theme === 'light') {
			theme = 'dark';
			document.body.classList.add('dark');
		} else {
			theme = 'light';
			document.body.classList.remove('dark');
		}
	}
</script>

<button
	on:click={toggleTheme}
	aria-label="Toggle theme"
	class="bg-slate-d3/40 hover:bg-slate-d4/40 focus:bg-slate-d5/40 dark:bg-slate-3/40 dark:hover:bg-slate-4/40 dark:focus:bg-slate-5/40 p-1 rounded"
>
	<LightBulbOnIcon class="block dark:hidden text-amber-3 hover:text-amber-4" />
	<LightBulbOffIcon class="hidden dark:block text-slate-d3 hover:text-slate-d4" />
</button>
