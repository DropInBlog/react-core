import { DropInBlogConfig, ResolvedDropInBlogConfig } from './types';

const DEFAULT_BASE_PATH = 'blog';
const DEFAULT_API_BASE_URL = 'https://api.dropinblog.com/v2';
const DEFAULT_FIELDS = ['head_data', 'body_html', 'head_items', 'head_html'];
const DEFAULT_CACHE_TTL = 1000 * 60 * 5; // 5 minutes

function readEnv(key: string): string | undefined {
  // eslint-disable-next-line no-undef
  if (typeof process !== 'undefined' && process?.env) {
    return process.env[key];
  }
  return undefined;
}

function ensureFetch(fetchImpl?: typeof fetch): typeof fetch {
  if (fetchImpl) return fetchImpl;
  if (typeof globalThis.fetch === 'function') {
    return globalThis.fetch.bind(globalThis);
  }
  throw new Error(
    'A fetch implementation is required. Provide config.fetchImpl when creating the DropInBlog client.'
  );
}

function normalizeBasePath(input?: string) {
  const trimmed = (input ?? DEFAULT_BASE_PATH).trim();
  const withoutSlashes = trimmed
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
  const normalized = withoutSlashes.length ? withoutSlashes : DEFAULT_BASE_PATH;
  const baseParts = normalized.split('/').filter(Boolean);
  const baseSegment = baseParts.join('/');
  const basePath = `/${baseSegment}`;
  return { baseSegment, basePath, baseParts };
}

export function resolveConfig(config: DropInBlogConfig = {}): ResolvedDropInBlogConfig {
  const blogId = config.blogId ?? readEnv('DROPINBLOG_BLOG_ID');
  const apiToken = config.apiToken ?? readEnv('DROPINBLOG_API_TOKEN');

  if (!blogId) {
    throw new Error('A DropInBlog blogId is required. Set config.blogId or DROPINBLOG_BLOG_ID.');
  }
  if (!apiToken) {
    throw new Error(
      'A DropInBlog API token is required. Set config.apiToken or DROPINBLOG_API_TOKEN.'
    );
  }

  const { basePath, baseSegment, baseParts } = normalizeBasePath(config.basePath);

  return {
    blogId,
    apiToken,
    basePath,
    baseSegment,
    baseParts,
    apiBaseUrl: (config.apiBaseUrl ?? DEFAULT_API_BASE_URL).replace(/\/$/, ''),
    fetchImpl: ensureFetch(config.fetchImpl),
    cacheTtlMs: config.cacheTtlMs ?? DEFAULT_CACHE_TTL,
    defaultFields: config.defaultFields ?? DEFAULT_FIELDS,
  };
}

export type { DropInBlogConfig } from './types';
