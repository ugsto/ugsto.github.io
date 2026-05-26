import type { WorkshopPage, WorkshopMetadata } from '$lib/workshop/domain/models';
import { marked } from 'marked';

const extractSlugFromPath = (path: string): string | undefined =>
  path.match(/\/workshop\/content\/(?<slug>[^/]+)\/metadata\.json$/)?.groups?.slug;

const extractKeyFromContentPath = (path: string): { slug: string; locale: string; kind: 'content' | 'slides' } | undefined => {
  const contentMatch = path.match(/\/workshop\/content\/(?<slug>[^/]+)\/content\.(?<locale>[^\.]+)\.md$/);
  if (contentMatch?.groups) {
    return { slug: contentMatch.groups.slug, locale: contentMatch.groups.locale, kind: 'content' };
  }
  const slidesMatch = path.match(/\/workshop\/content\/(?<slug>[^/]+)\/slides\.(?<locale>[^\.]+)\.md$/);
  if (slidesMatch?.groups) {
    return { slug: slidesMatch.groups.slug, locale: slidesMatch.groups.locale, kind: 'slides' };
  }
  return undefined;
};

const toContentKey = (slug: string, locale: string) => `${slug}/${locale}`;

class FileSystemWorkshopRepository {
  private readonly metadata = new Map<string, WorkshopMetadata>(
    Object.entries(
      import.meta.glob<WorkshopMetadata>('$lib/workshop/content/*/metadata.json', { eager: true })
    )
      .map(([path, data]) => [extractSlugFromPath(path), data] as const)
      .filter((entry): entry is [string, WorkshopMetadata] => Boolean(entry[0]))
  );

  private readonly rawLoaders = new Map<string, () => Promise<string>>(
    Object.entries(
      import.meta.glob('$lib/workshop/content/*/content.*.md', { query: '?raw', import: 'default' })
    )
      .map(([path, loadFn]) => {
        const key = extractKeyFromContentPath(path);
        if (!key) return null;
        return [toContentKey(key.slug, key.locale) + ':content', loadFn as () => Promise<string>];
      })
      .filter((entry): entry is [string, () => Promise<string>] => Boolean(entry))
  );

  private readonly slidesLoaders = new Map<string, () => Promise<string>>(
    Object.entries(
      import.meta.glob('$lib/workshop/content/*/slides.*.md', { query: '?raw', import: 'default' })
    )
      .map(([path, loadFn]) => {
        const key = extractKeyFromContentPath(path);
        if (!key) return null;
        return [toContentKey(key.slug, key.locale) + ':slides', loadFn as () => Promise<string>];
      })
      .filter((entry): entry is [string, () => Promise<string>] => Boolean(entry))
  );

  async getAllSlugs(): Promise<string[]> {
    return Array.from(this.metadata.keys());
  }

  async getBySlug(slug: string, locale: string): Promise<WorkshopPage | null> {
    const meta = this.metadata.get(slug);
    const loadRaw = this.rawLoaders.get(toContentKey(slug, locale) + ':content');
    const loadSlides = this.slidesLoaders.get(toContentKey(slug, locale) + ':slides');

    if (!meta || !loadRaw) return null;

    const rawMd = await loadRaw();
    const slidesMd = await (loadSlides?.() ?? Promise.resolve(rawMd));
    const content = await marked(rawMd);

    return { ...meta, slug, rawMd, slidesMd, content };
  }
}

export const workshopRepository = new FileSystemWorkshopRepository();
