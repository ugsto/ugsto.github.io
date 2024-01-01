<script lang="ts">
	import Markdown from '$lib/components/Markdown.svelte';
	import PostAuthor from '$lib/components/PostAuthor.svelte';
	import type { BlogPostPageData } from './+page';
	import Tag from '$lib/components/Tag.svelte';

	export let data: BlogPostPageData;

	const { author, date, tags, content, readingTime } = data;
</script>

<div class="bg-slate-2 dark:bg-slate-d2 flex-grow pt-4">
	<aside class="block px-8 py-4 mx-auto w-fit">
		<div class="flex flex-col gap-4">
			<PostAuthor {author} {date} {readingTime} />
			<div class="flex flex-wrap gap-2">
				{#each tags as tag}
					<Tag {tag} />
				{/each}
			</div>
		</div>
	</aside>
	<main>
		<article id="post" class="px-8 py-4 prose md:prose-xl dark:prose-invert">
			<Markdown {content} />
		</article>
	</main>
</div>
