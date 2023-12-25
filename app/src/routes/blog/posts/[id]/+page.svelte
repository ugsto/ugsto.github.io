<script lang="ts">
	import Markdown from '$lib/components/Markdown.svelte';
	import PostAuthor from '$lib/components/PostAuthor.svelte';
	import type { BlogPostPageData } from './+page';
	import Tag from '$lib/components/Tag.svelte';

	export let data: BlogPostPageData;

	const { author, date, tags, content, readingTime } = data;
</script>

<div class=" bg-slate-2 dark:bg-slate-d2">
	<div class="flex flex-col w-fit md:flex-row md:items-start mx-auto">
		<aside class="mt-4 px-8 py-4">
			<div class="flex flex-col gap-4">
				<PostAuthor {author} {date} {readingTime} />
				<div class="flex flex-wrap gap-2">
					{#each tags as tag}
						<Tag {tag} />
					{/each}
				</div>
			</div>
		</aside>
		<article id="post" class="px-8 py-4 prose lg:prose-xl dark:prose-invert">
			<Markdown {content} />
		</article>
	</div>
</div>
