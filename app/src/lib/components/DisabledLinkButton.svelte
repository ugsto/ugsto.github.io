<script lang="ts">
	export let extraClass: string = '';
	export let reactToDarkMode = true;

	const darkModeClasses = 'dark:bg-slate-d9';

	const classes = `bg-slate-9 text-slate-d12 px-4 py-2 rounded mt-4 inline-block cursor-not-allowed ${
		reactToDarkMode ? darkModeClasses : ''
	} ${extraClass}`;
</script>

<span {...$$restProps} class={classes}><slot /></span>
