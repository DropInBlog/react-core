import { DropInBlogClient } from './client';
import { matchRoute } from './routes';
import {
  RenderedResponse,
  RouteMatch,
  RouteResolution,
  ResolvedDropInBlogConfig,
} from './types';

async function resolveByMatch(
  match: RouteMatch,
  client: DropInBlogClient
): Promise<RenderedResponse> {
  switch (match.kind) {
    case 'main-list':
      return client.fetchMainList(match.page ?? 1);
    case 'category-list': {
      const slug = match.params?.slug;
      if (!slug) throw new Error('Category routes require a slug parameter.');
      return client.fetchCategory(slug, match.page ?? 1);
    }
    case 'author-list': {
      const slug = match.params?.slug;
      if (!slug) throw new Error('Author routes require a slug parameter.');
      return client.fetchAuthor(slug, match.page ?? 1);
    }
    case 'post': {
      const slug = match.params?.slug;
      if (!slug) throw new Error('Post routes require a slug parameter.');
      return client.fetchPost(slug);
    }
    default:
      throw new Error(`Unsupported route type: ${(match as RouteMatch).kind}`);
  }
}

export class DropInBlogRouter {
  constructor(
    private readonly config: ResolvedDropInBlogConfig,
    private readonly client: DropInBlogClient
  ) {}

  match(pathname: string): RouteMatch | null {
    return matchRoute(pathname, this.config);
  }

  async resolve(pathname: string): Promise<RouteResolution> {
    const match = this.match(pathname);
    if (!match) {
      throw new Error(`No DropInBlog route matched pathname: ${pathname}`);
    }

    const payload = await resolveByMatch(match, this.client);
    return { match, payload };
  }
}

export function createDropInBlogRouter(
  config: ResolvedDropInBlogConfig,
  client: DropInBlogClient
) {
  return new DropInBlogRouter(config, client);
}
