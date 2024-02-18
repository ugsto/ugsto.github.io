<script lang="ts">
	export let href: string;
	export let isActive: boolean;
</script>

<a
	{href}
	{...$$props}
	aria-current={isActive ? 'page' : undefined}
	class="inline-block px-3 py-2 rounded hover:bg-slate-4 {isActive
		? 'bg-slate-d3 text-slate-1'
		: 'bg-slate-3 text-slate-d3'}"
>
	<slot />
</a>
