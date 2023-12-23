<script lang="ts">
	export let tag: string;
	export let extraClass = '';

	const classes = `text-xs text-indigo-11 bg-indigo-3 rounded px-2 py-1 ${extraClass}`;
</script>

<span {...$$restProps} class={classes}>
	#{tag}
</span>
