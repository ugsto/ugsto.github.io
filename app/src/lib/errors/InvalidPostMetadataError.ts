import { ApplicationError } from './ApplicationError';
import { z } from 'zod';

export class InvalidPostMetadataError extends ApplicationError {
  static fromZodError(error: z.ZodError) {
    return new InvalidPostMetadataError(
      'Post metadata validation failed:\n' +
      error.issues
        .map((issue) => `- Field "${issue.path.join('.')}" ${issue.message}.`)
        .join('\n')
    );
  }

  static fromSyntaxError() {
    return new InvalidPostMetadataError(
      'Post metadata validation failed: Not a valid JSON object.'
    );
  }

  static fromInvalidTag(tag: string) {
    return new InvalidPostMetadataError(`Post metadata validation failed: Invalid tag "${tag}".`);
  }

  static fromInvalidAuthor(authorId: number) {
    return new InvalidPostMetadataError(
      `Post metadata validation failed: Invalid author "${authorId}".`
    );
  }
}
