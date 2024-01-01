import type { PostMetadata } from '$lib/schemas/PostMetadataSchema';
import { PostService } from '$lib/services/PostService';
import { supportedLocales } from '$lib/translations';
import { error } from '@sveltejs/kit';

const POSTS_PER_PAGE = 10;

const posts = PostService.fetchPostsMetadata().filter(
	(metadata): metadata is PostMetadata => !(metadata instanceof Error)
);
const maxPage = Math.ceil(posts.length / POSTS_PER_PAGE);

export type PostPageData = {
	posts: PostMetadata[];
	tags: string[];
	pageNumber: number;
	maxPage: number;
};

export function load({ params: { page } }: { params: { page: string } }): PostPageData {
	const pageNumber = parseInt(page);

	if (pageNumber < 1 || pageNumber > maxPage) {
		throw error(404, 'Page not found');
	}

	const tags = [...new Set(posts.flatMap((post) => post.tags))].sort();
	const start = (pageNumber - 1) * POSTS_PER_PAGE;
	const end = start + POSTS_PER_PAGE;

	const postsSlice = posts.slice(start, end);

	return {
		posts: postsSlice,
		tags,
		pageNumber,
		maxPage
	};
}

export function entries() {
	return Array.from({ length: maxPage }, (_, i) => i + 1)
		.map(String)
		.map((page) => ({ page }))
		.map((entry) => supportedLocales.map((lang) => ({ ...entry, lang })))
		.flat();
}
