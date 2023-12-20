<script lang="ts">
	export let href: string;
</script>

<a {href} class="inline-block bg-indigo-3 hover:bg-indigo-4 text-indigo-11 px-2 py-1 rounded">
	<slot />
</a>
