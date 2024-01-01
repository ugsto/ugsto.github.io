import type { Author } from '$lib/schemas/AuthorSchema';
import type { PostMetadata } from '$lib/schemas/PostMetadataSchema';
import { AuthorService } from '$lib/services/AuthorService';
import { PostService } from '$lib/services/PostService';
import { supportedLocales } from '$lib/translations';
import { calculateReadingTime } from '$lib/utils/calculateReadingTime';
import { error } from '@sveltejs/kit';

export type BlogPostPageData = {
	author: Author;
	date: Date;
	tags: string[];
	content: string;
	readingTime: number;
};

export function load({ params: { id } }: { params: { id: string } }): BlogPostPageData {
	const numberId = parseInt(id);
	const postMetadata = PostService.fetchPostMetadata(numberId);

	if (!postMetadata) {
		throw error(404, postMetadata);
	}
	if (postMetadata instanceof Error) {
		throw postMetadata;
	}

	const author = AuthorService.fetchAuthor(postMetadata.authorId)!;
	const date = new Date(postMetadata.date);
	const tags = postMetadata.tags;
	const postContent = PostService.fetchPostContent(postMetadata);
	const readingTime = calculateReadingTime(postContent);

	return {
		author,
		date,
		tags,
		content: postContent,
		readingTime
	};
}

export function entries() {
	return PostService.fetchPostsMetadata()
		.filter((metadata): metadata is PostMetadata => !(metadata instanceof Error))
		.map(({ id }) => ({
			id: id.toString()
		}))
		.map((entry) => supportedLocales.map((lang) => ({ ...entry, lang })))
		.flat();
}
