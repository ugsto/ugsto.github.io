import type { Hateoas } from '$lib/schemas/HateoasSchema';
import type { PostMetadata } from '$lib/schemas/PostMetadataSchema';
import { PostService } from '$lib/services/PostService';
import { json } from '@sveltejs/kit';
import { objectWithoutProperties } from '$lib/utils/objectWithoutProperties';
import type { ApplicationError } from '$lib/errors/ApplicationError';

function clusterByIsError(posts: Array<PostMetadata | ApplicationError>) {
  return posts.reduce(
    (acc, post) => {
      if (post instanceof Error) {
        acc['errors'].push(post);
      } else {
        acc['posts'].push(post);
      }
      return acc;
    },
    {
      posts: [] as PostMetadata[],
      errors: [] as ApplicationError[]
    }
  );
}

function appendHateoas(post: PostMetadata): Omit<PostMetadata, 'contentUrl'> & Hateoas {
  return {
    ...objectWithoutProperties(post, ['contentUrl']),
    links: [
      {
        type: 'GET' as const,
        rel: 'content',
        href: post.contentUrl
      }
    ]
  };
}

function formatError(error: ApplicationError) {
  return {
    message: error.message
  };
}

export async function GET() {
  const postsMetadata = PostService.fetchPostsMetadata();
  const { posts: rawPosts, errors: rawErrors } = clusterByIsError(postsMetadata);
  const posts = rawPosts.map(appendHateoas);
  const errors = rawErrors.map(formatError);

  if (errors.length > 0) {
    return json({
      posts,
      errors
    });
  }

  return json({
    posts
  });
}

export const prerender = true;
