<script lang="ts">
	export let extraClass = '';
	export let reactToDarkMode = true;

	const darkModeClasses = 'dark:text-slate-d12';

	const classes = `text-2xl font-bold mb-4 text-slate-12 ${
		reactToDarkMode ? darkModeClasses : ''
	} ${extraClass}`;
</script>

<h2 {...$$restProps} class={classes}><slot /></h2>
