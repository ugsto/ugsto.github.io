import type { BlogPostRepository } from '$lib/blog/domain/repositories';
import { ReadTime, type BlogPost, type BlogPostSummary, type PostMetadata } from '$lib/blog/domain/models';
import { marked } from 'marked';

const extractSlugFromMetaPath = (path: string): string | undefined =>
  path.match(/\/content\/([^/]+)\/metadata\.json$/)?.[1];

const extractKeyFromContentPath = (path: string): { slug: string, locale: string } | undefined => {
  const match = path.match(/\/content\/(?<slug>[^\/]+)\/content\.(?<locale>[^\.]+)\.md$/);
  if (!match?.groups) return undefined;
  const { slug, locale } = match.groups;
  return { slug, locale };
};

const toContentKey = (slug: string, locale: string) => `${slug}/${locale}`;

export class FileSystemBlogPostRepository implements BlogPostRepository {
  private readonly metadata = new Map<string, PostMetadata>(
    Object.entries(import.meta.glob<PostMetadata>('$lib/blog/content/*/metadata.json', { eager: true }))
      .map(([path, data]) => [extractSlugFromMetaPath(path), data] as const)
      .filter((entry): entry is [string, PostMetadata] => Boolean(entry[0]))
  );

  private readonly contentLoaders = new Map<string, () => Promise<string>>(
    Object.entries(import.meta.glob('$lib/blog/content/*/content.*.md', { query: '?raw', import: 'default' }))
      .map(([path, loadFn]) => {
        const key = extractKeyFromContentPath(path);
        if (!key) return null;
        const { slug, locale } = key;
        return [toContentKey(slug, locale), loadFn];
      })
      .filter((entry): entry is [string, () => Promise<string>] => Boolean(entry))
  );

  private toSummary = (slug: string, raw: PostMetadata, locale: string): BlogPostSummary | null => {
    const localized = raw.locales[locale] ?? Object.values(raw.locales)[0];

    return localized ? {
      slug,
      date: new Date(raw.date),
      readTime: new ReadTime(raw.readTimeSeconds),
      thumbnail: raw.thumbnail,
      isFeatured: raw.isFeatured,
      title: localized.title,
      excerpt: localized.excerpt,
      categories: localized.categories
    } : null;
  };

  async getAllPosts(locale: string): Promise<BlogPostSummary[]> {
    return Array.from(this.metadata.entries())
      .map(([slug, raw]) => this.toSummary(slug, raw, locale))
      .filter((post): post is BlogPostSummary => post !== null)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getFeaturedPost(locale: string): Promise<BlogPostSummary | null> {
    return (await this.getAllPosts(locale))
      .find(p => p.isFeatured) ?? null;
  }

  async getPostBySlug(slug: string, locale: string): Promise<BlogPost | null> {
    const metadata = this.metadata.get(slug);
    const loadContent = this.contentLoaders.get(toContentKey(slug, locale));

    if (!metadata || !loadContent) return null;

    const summary = this.toSummary(slug, metadata, locale);
    if (!summary) return null;

    return { ...summary, content: await marked(await loadContent()) };
  }

  async getCategories(locale: string): Promise<string[]> {
    return this.getAllPosts(locale)
      .then(posts => posts.flatMap(post => post.categories))
      .then(categories => [...new Set(categories)].sort());
  }
}

export const blogRepository = new FileSystemBlogPostRepository();
