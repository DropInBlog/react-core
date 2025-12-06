export type MaybeArray<T> = T | T[];

export type ScriptDescriptor =
  | string
  | {
      src: string;
      type?: string;
      async?: boolean;
      defer?: boolean;
      [attribute: string]: string | boolean | undefined;
    };

export type HeadData = {
  title?: string;
  description?: string;
  image?: string;
  canonical_url?: string;
  rss_url?: string;
  seo_url_next?: string;
  seo_url_prev?: string;
  schema?: string | Record<string, unknown>;
  noindex?: boolean;
  fonts?: MaybeArray<string>;
  js?: MaybeArray<ScriptDescriptor>;
  css?: MaybeArray<string>;
};

export interface HeadItem {
  tag: string;
  attributes?: Record<string, string>;
  content?: string;
}

export type HeadItems =
  | HeadItem[]
  | Record<string, HeadItem | HeadItem[] | null | undefined>;

export interface RenderedResponse {
  body_html?: string;
  head_html?: string;
  head_items?: HeadItems;
  head_data?: HeadData;
  content_type?: string;
  slug?: string;
  sitemap?: string;
  feed?: string;
}

export interface DropInBlogApiResponse {
  code: number;
  message: string;
  data: RenderedResponse;
  locale?: string;
  success: boolean;
}

export interface RouteResolution {
  match: RouteMatch;
  payload: RenderedResponse;
}


export type RouteKind =
  | 'main-list'
  | 'category-list'
  | 'author-list'
  | 'post';

export interface RouteMatch {
  kind: RouteKind;
  pathname: string;
  params?: {
    slug?: string;
  };
  page?: number;
}

export interface DropInBlogConfig {
  blogId?: string;
  apiToken?: string;
  basePath?: string;
  apiBaseUrl?: string;
  fetchImpl?: typeof fetch;
  cacheTtlMs?: number;
  defaultFields?: string[];
}

export interface ResolvedDropInBlogConfig {
  blogId: string;
  apiToken: string;
  basePath: string; // e.g. /blog or /resources/blog
  baseSegment: string; // e.g. blog or resources/blog
  baseParts: string[];
  apiBaseUrl: string;
  fetchImpl: typeof fetch;
  cacheTtlMs: number;
  defaultFields: string[];
}
