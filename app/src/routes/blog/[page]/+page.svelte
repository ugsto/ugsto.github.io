<script lang="ts">
	import Title from '$lib/components/Title.svelte';
	import Tag from '$lib/components/Tag.svelte';
	import Link from '$lib/components/Link.svelte';
	import Subtitle from '$lib/components/Subtitle.svelte';
	import type { PostPageData } from './+page';

	export let data: PostPageData;
</script>

<div class="flex flex-col flex-grow justify-between">
	<div class="flex flex-col sm:flex-row px-8 py-4">
		<section id="posts" class="w-3/4">
			<Title>Posts</Title>
			{#each data.posts as post}
				<div class="mb-4">
					<Subtitle><Link href={`/blog/posts/${post.id}`}>{post.title}</Link></Subtitle>
					<p>{post.description}</p>
					<div class="flex flex-wrap gap-2 mt-2">
						{#each post.tags as tag}
							<Tag {tag} />
						{/each}
					</div>
				</div>
			{/each}
		</section>
		<aside class="w-full sm:w-1/4">
			<Title>Tags</Title>
			<div class="flex flex-wrap gap-2">
				{#each data.tags as tag}
					<Tag {tag} title="We are currently in beta, so filter by tag is still not available" />
				{/each}
			</div>
		</aside>
	</div>

	<section id="pagination" class="block px-8 py-4">
		<div class="flex justify-center">
			{#if data.pageNumber > 1}
				<Link href={`/blog/${data.pageNumber - 1}`}>&lt; Prev</Link>
			{/if}
			<span class="mx-4">Page {data.pageNumber} of {data.maxPage}</span>
			{#if data.pageNumber < data.maxPage}
				<Link href={`/blog/${data.pageNumber + 1}`}>Next &gt;</Link>
			{/if}
		</div>
	</section>
</div>
