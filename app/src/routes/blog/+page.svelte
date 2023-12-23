<script lang="ts">
	import { PostService } from '$lib/services/PostService';
	import { TagService } from '$lib/services/TagService';
	import Title from '$lib/components/Title.svelte';
	import Tag from '$lib/components/Tag.svelte';
	import type { PostMetadata } from '$lib/schemas/PostMetadataSchema';
	import Link from '$lib/components/Link.svelte';
	import Subtitle from '$lib/components/Subtitle.svelte';

	const posts = PostService.fetchPostsMetadata().filter(
		(post): post is PostMetadata => !(post instanceof Error)
	);
	const tags = TagService.fetchTags()
		.map((tag) => tag.slug)
		.sort();

	const recentPosts = posts
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
		.slice(0, 3);
</script>

<div class="flex flex-col sm:flex-row px-8 py-4">
	<section id="posts" class="w-3/4 p-4">
		<Title>Recent Posts</Title>
		{#each recentPosts as post}
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
	<aside class="w-full sm:w-1/4 p-4">
		<Title>Tags</Title>
		<div class="flex flex-wrap gap-2">
			{#each tags as tag}
				<Tag {tag} />
			{/each}
		</div>
	</aside>
</div>
