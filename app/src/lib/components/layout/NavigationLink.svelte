<script lang="ts">
	export let href: string;
</script>

<a
	{href}
	class="inline-block bg-indigo-3 hover:bg-indigo-4 dark:bg-indigo-d3 dark:hover:bg-indigo-d4 text-indigo-11 dark:text-indigo-d11 px-2 py-1 rounded"
>
	<slot />
</a>
