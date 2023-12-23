<script lang="ts">
	export let href: string;
	export let extraClass: string = '';

	const classes = `bg-indigo-9 text-slate-d12 hover:bg-indigo-10 px-4 py-2 rounded mt-4 inline-block ${extraClass}`;
</script>

<a {...$$restProps} {href} class={classes}><slot /></a>
