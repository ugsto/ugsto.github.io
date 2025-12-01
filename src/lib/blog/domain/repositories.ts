import type { BlogPost, BlogPostSummary, } from './models';

export interface BlogPostRepository {
  getAllPosts(locale: string): Promise<BlogPostSummary[]>;
  getPostBySlug(slug: string, locale: string): Promise<BlogPost | null>;
  getFeaturedPost(locale: string): Promise<BlogPostSummary | null>;
  getCategories(locale: string): Promise<string[]>;
}
