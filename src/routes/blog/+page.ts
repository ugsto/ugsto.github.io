import { blogRepository } from '$lib/blog/infrastructure/fs-post-repository';
import { getLocale } from '$lib/paraglide/runtime';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  const locale = getLocale()
  const [posts, featuredPost, categories] = await Promise.all([
    blogRepository.getAllPosts(locale),
    blogRepository.getFeaturedPost(locale),
    blogRepository.getCategories(locale)
  ]);

  return {
    posts,
    featuredPost,
    categories
  };
};
