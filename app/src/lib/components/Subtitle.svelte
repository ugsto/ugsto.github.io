<script lang="ts">
	export let extraClass = '';
	export let reactToDarkMode = true;

	const darkModeClasses = 'dark:text-slate-d12';

	const classes = `text-xl font-bold mb-2 text-slate-12 ${
		reactToDarkMode ? darkModeClasses : ''
	} ${extraClass}`;
</script>

<h3 {...$$restProps} class={classes}><slot /></h3>
