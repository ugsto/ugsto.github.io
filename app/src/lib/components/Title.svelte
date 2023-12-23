<script lang="ts">
	export let extraClass = '';

	const classes = `text-2xl font-bold mb-4 ${extraClass}`;
</script>

<h2 {...$$restProps} class={classes}><slot /></h2>
