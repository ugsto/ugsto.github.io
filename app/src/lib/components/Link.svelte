<script lang="ts">
	export let href: string;
	export let extraClass: string = '';

	const classes = `underline text-indigo-11 hover:text-indigo-12 ${extraClass}`;
</script>

<a {...$$restProps} {href} class={classes}><slot /></a>
