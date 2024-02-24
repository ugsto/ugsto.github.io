<script lang="ts">
	export let id: string;
	export let items: Array<{ href: string; src: string; alt: string; description?: string }> = [];
</script>

<div {id}>
	<div class="scroll-smooth flex overflow-x-auto scrollbar-hide snap-x snap-mandatory touch-pan-x">
		{#each items as { href, src, alt, description }, index}
			<div
				class="snap-start flex-shrink-0 w-full h-full flex items-center justify-center"
				id={`${id}-item-${index}`}
			>
				<a {href} target="_blank">
					<img {src} {alt} class="h-80 object-cover mx-auto" />
					{#if description}
						<p class="text-center mt-2 text-slate-12 dark:text-slate-d12">
							{description}
						</p>
					{/if}
				</a>
			</div>
		{/each}
	</div>

	<nav class="flex justify-center items-center mt-4">
		{#each items as _, index}
			<a
				href={`#${id}-item-${index}`}
				class="inline-block p-2 mx-1 rounded bg-iris-4 hover:bg-iris-5 dark:bg-iris-d9 dark:hover:bg-iris-d10 dark:text-iris-d12"
			>
				{index + 1}
			</a>
		{/each}
	</nav>
</div>
