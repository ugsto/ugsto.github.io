<script lang="ts">
	export let extraClass = '';

	const classes = `text-xl font-bold mb-2 ${extraClass}`;
</script>

<h3 {...$$restProps} class={classes}><slot /></h3>
