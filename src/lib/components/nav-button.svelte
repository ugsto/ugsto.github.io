<script lang="ts">
	export let href: string;
	export let isActive: boolean;

	const nonActiveClass = 'inline-block bg-slate-3 hover:bg-slate-4 text-slate-12 px-3 py-2 rounded';
	const activeClass = 'inline-block bg-slate-12 hover:bg-slate-12 text-slate-1 px-3 py-2 rounded';

	$: classes = isActive ? activeClass : nonActiveClass;
</script>

<a {href} {...$$props} class={classes}><slot /> </a>
