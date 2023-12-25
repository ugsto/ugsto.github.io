<script lang="ts">
	export let extraClass = '';
	export let reactToDarkMode = true;

	const darkModeClasses = 'dark:text-slate-d11';

	const classes = `text-justify text-slate-11 ${
		reactToDarkMode ? darkModeClasses : ''
	} ${extraClass}`;
</script>

<p {...$$restProps} class={classes}><slot /></p>
