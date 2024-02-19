<script>
	import IconWeatherSunny from 'virtual:icons/mdi/weather-sunny';
	import IconWeatherNight from 'virtual:icons/mdi/weather-night';

	let theme = 'light';

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
	aria-label="Toggle theme"
	class="rounded p-1 bg-slate-6 hover:bg-slate-7 dark:bg-slate-d6 dark:hover:bg-slate-d7"
	on:click={toggleTheme}
>
	<IconWeatherSunny
		aria-current={theme === 'light' ? 'page' : undefined}
		class="block dark:hidden text-xl text-amber-11"
	/>
	<IconWeatherNight
		aria-current={theme === 'dark' ? 'page' : undefined}
		class="hidden dark:block text-xl text-sage-d11"
	/>
</button>
