import { error } from '@sveltejs/kit';
import { blogRepository } from '$lib/blog/infrastructure/fs-post-repository';
import type { PageLoad, EntryGenerator } from './$types';
import { getLocale } from '$lib/paraglide/runtime';

export const entries: EntryGenerator = async () => {
  const posts = await blogRepository.getAllPosts(getLocale());
  return posts.map((post) => ({ slug: post.slug }));
};

export const load: PageLoad = async ({ params }) => {
  const post = await blogRepository.getPostBySlug(params.slug, getLocale());

  if (!post) {
    throw error(404, {
      message: 'Signal lost. The requested entry does not exist in the logs.'
    });
  }

  return {
    post
  };
};
