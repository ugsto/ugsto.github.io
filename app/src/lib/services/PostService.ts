import { InvalidPostMetadataError } from '$lib/errors/InvalidPostMetadataError';
import { UnknownError } from '$lib/errors/UnknownError';
import { PostMetadataSchema, type PostMetadata } from '$lib/schemas/PostMetadataSchema';
import { ZodError } from 'zod';
import { TagService } from './TagService'; // Import the TagService
import { AuthorService } from './AuthorService';

export class PostService {
  static postMetadataFiles: Record<string, PostMetadata & { default: PostMetadata }> =
    import.meta.glob('/src/blog/posts/*.json', {
      eager: true
    });
  static postFiles = import.meta.glob('/src/blog/posts/*.md', { eager: true, as: 'raw' });

  constructor() { }

  static parseMetadata(
    metadataPath: string,
    rawMetadata: PostMetadata & { default: PostMetadata }
  ) {
    try {
      const contentUrl = metadataPath.replace(/\.json$/, '.md');
      const metadata: PostMetadata = PostMetadataSchema.parse({
        ...rawMetadata.default,
        contentUrl
      });

      const invalidTags = TagService.filterInvalidTags(metadata.tags);
      if (invalidTags.length > 0) {
        return InvalidPostMetadataError.fromInvalidTag(invalidTags.join(', '));
      }

      const authorExists = AuthorService.authorExists(metadata.authorId);
      if (!authorExists) {
        return InvalidPostMetadataError.fromInvalidAuthor(metadata.authorId);
      }

      return metadata;
    } catch (error) {
      if (error instanceof ZodError) {
        return InvalidPostMetadataError.fromZodError(error);
      }
      if (error instanceof SyntaxError) {
        return InvalidPostMetadataError.fromSyntaxError();
      }

      return new UnknownError();
    }
  }

  static fetchPostsMetadata() {
    return Object.entries(this.postMetadataFiles).map(([path, metadata]) =>
      this.parseMetadata(path, metadata)
    );
  }

  static fetchPostMetadata(id: number) {
    const metadata = Object.entries(this.postMetadataFiles).find(
      ([, metadata]) => metadata.id === id
    );

    if (!metadata) {
      return undefined;
    }

    return this.parseMetadata(metadata[0], metadata[1]);
  }

  static fetchPostContent(postMetadata: PostMetadata) {
    return this.postFiles[postMetadata.contentUrl];
  }
}
