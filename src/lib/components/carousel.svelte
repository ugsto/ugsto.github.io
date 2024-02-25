<script lang="ts">
	import { onMount } from 'svelte';

	export let id: string;
	export let items: Array<{
		title: string;
		href: string;
		src: string;
		alt: string;
		description?: string;
	}> = [];

	onMount(() => {
		const anchors = document.querySelectorAll(`#${id} nav a[href^="#"]`);
		anchors.forEach((anchor) => {
			anchor.addEventListener('click', function (e) {
				e.preventDefault();

				const targetId = anchor.getAttribute('href')!;
				const targetElement = document.querySelector(targetId);

				if (!targetElement) {
					return;
				}

				const scrollContainer = document.querySelector(`#${id} .scroll-smooth`);
				const scrollX = (targetElement as unknown as { offsetLeft: number }).offsetLeft;

				scrollContainer!.scrollTo({
					left: scrollX,
					behavior: 'smooth'
				});
			});
		});
	});
</script>

<div {id}>
	<div class="scroll-smooth flex overflow-x-auto scrollbar-hide snap-x snap-mandatory touch-pan-x">
		{#each items as { title, href, src, alt, description }, index}
			<div
				class="snap-start flex-shrink-0 w-full h-full flex items-center justify-center"
				id={`${id}-item-${index}`}
			>
				<div
					class="container rounded-2xl flex flex-col justify-center items-center gap-4 dark:bg-iris-d9/30 px-4 py-2"
				>
					<h3 class="text-2xl font-bold text-iris-12 dark:text-iris-d12">
						<a {href} target="_blank" class="hover:underline">
							{title}
						</a>
					</h3>
					<a {href} target="_blank" class="rounded-full dark:bg-slate-2 overflow-hidden shadow-xl">
						<img {src} {alt} class="h-80 w-80 p-10" />
					</a>
					{#if description}
						<p class="text-center text-xl text-slate-12 dark:text-slate-d12">
							{description}
						</p>
					{/if}
				</div>
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
