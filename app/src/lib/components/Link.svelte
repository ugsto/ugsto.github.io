<script lang="ts">
	export let href: string;
	export let extraClass: string = '';
	export let reactToDarkMode = true;

	const darkModeClasses = 'dark:text-indigo-d11 dark:hover:text-indigo-d12';

	const classes = `underline text-indigo-11 hover:text-indigo-12 ${
		reactToDarkMode ? darkModeClasses : ''
	} ${extraClass}`;
</script>

<a {...$$restProps} {href} class={classes}><slot /></a>
