import type { Author } from '$lib/schemas/AuthorSchema';

export class AuthorService {
  private static authorFiles: Record<string, Author & { default: Author }> = import.meta.glob(
    '/src/blog/authors/*.json',
    { eager: true }
  );

  constructor() { }

  static authorExists(id: number): boolean {
    return Object.values(this.authorFiles).some((author) => author.id === id);
  }

  static fetchAuthor(id: number) {
    return Object.values(this.authorFiles).find((author) => author.id === id);
  }
}
