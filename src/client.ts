import { RenderedResponse, ResolvedDropInBlogConfig } from './types';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

interface RequestOptions {
  searchParams?: Record<string, string | number | undefined>;
  fields?: string[];
  skipCache?: boolean;
}

const joinSearchParams = (
  init: Record<string, string | number | undefined> | undefined,
  url: URL
) => {
  if (!init) return;
  Object.entries(init).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    url.searchParams.set(key, String(value));
  });
};

export class DropInBlogClient {
  private cache = new Map<string, CacheEntry<RenderedResponse>>();

  constructor(private readonly config: ResolvedDropInBlogConfig) {}

  private buildUrl(path: string, options: RequestOptions = {}) {
    const trimmedPath = path.replace(/^\/+/, '');
    const url = new URL(
      `${this.config.apiBaseUrl}/blog/${this.config.blogId}/rendered/${trimmedPath}`
    );

    const fieldsToUse = options.fields ?? this.config.defaultFields;
    if (fieldsToUse?.length) {
      url.searchParams.set('fields', fieldsToUse.join(','));
    }

    joinSearchParams(options.searchParams, url);

    return url;
  }

  private buildCacheKey(url: URL) {
    return url.toString();
  }

  private async request<T extends RenderedResponse = RenderedResponse>(
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = this.buildUrl(path, options);
    const cacheKey = this.buildCacheKey(url);

    if (!options.skipCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.data as T;
      }
    }

    const response = await this.config.fetchImpl(url.toString(), {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${this.config.apiToken}`,
      },
    });

    if (!response.ok) {
      const errorPayload = await response.text();
      throw new Error(
        `DropInBlog request failed (${response.status}): ${errorPayload}`
      );
    }

    const json = (await response.json()) as { data: T } | T;
    const data = 'data' in json ? json.data : json;

    if (!options.skipCache) {
      this.cache.set(cacheKey, {
        data,
        expiresAt: Date.now() + this.config.cacheTtlMs,
      });
    }

    return data;
  }

  public clearCache() {
    this.cache.clear();
  }

  fetchMainList(page = 1) {
    return this.request('list', {
      searchParams: { page: page > 1 ? page : undefined },
    });
  }

  fetchCategory(slug: string, page = 1) {
    return this.request(`list/category/${encodeURIComponent(slug)}`, {
      searchParams: { page: page > 1 ? page : undefined },
    });
  }

  fetchAuthor(slug: string, page = 1) {
    return this.request(`list/author/${encodeURIComponent(slug)}`, {
      searchParams: { page: page > 1 ? page : undefined },
    });
  }

  fetchPost(slug: string) {
    return this.request(`post/${encodeURIComponent(slug)}`);
  }

  fetchSitemap() {
    return this.request('sitemap', { fields: [] });
  }

  fetchFeed() {
    return this.request('feed', { fields: [] });
  }

  fetchCategoryFeed(slug: string) {
    return this.request(`feed/category/${encodeURIComponent(slug)}`, { fields: [] });
  }

  fetchAuthorFeed(slug: string) {
    return this.request(`feed/author/${encodeURIComponent(slug)}`, { fields: [] });
  }
}

export type { RenderedResponse } from './types';
