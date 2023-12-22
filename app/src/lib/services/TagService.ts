import type { Tag } from '$lib/schemas/TagSchema';

export class TagService {
  static tagsFiles: Record<string, Tag & { default: Tag }> = import.meta.glob(
    '/src/blog/tags/*.json',
    {
      eager: true
    }
  );

  constructor() { }

  static tagExists(slug: string): boolean {
    return Object.values(this.tagsFiles).some((tag) => tag.slug === slug);
  }

  static filterInvalidTags(tags: string[]): string[] {
    return tags.filter((tag) => !this.tagExists(tag));
  }
}
