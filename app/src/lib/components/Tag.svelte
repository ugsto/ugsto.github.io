<script lang="ts">
	export let tag: string;
	export let extraClass = '';
	export let reactToDarkMode = true;

	const darkModeClasses = 'dark:bg-indigo-d3 dark:text-indigo-d11';

	const classes = `text-xs text-indigo-11 bg-indigo-3 rounded px-2 py-1 ${
		reactToDarkMode ? darkModeClasses : ''
	} ${extraClass}`;
</script>

<span
	{...$$restProps}
	title="We are currently in beta, so filter by tag is still not available"
	class={classes}
>
	#{tag}
</span>
