import { DropInBlogConfig, ResolvedDropInBlogConfig } from './types';

const DEFAULT_BASE_PATH = 'blog';
const DEFAULT_API_BASE_URL = 'https://api.dropinblog.com/v2';
const DEFAULT_FIELDS = ['head_data', 'body_html', 'head_items', 'head_html'];
const DEFAULT_CACHE_TTL = 1000 * 60 * 5; // 5 minutes
const DEFAULT_PACKAGE_SOURCE =
  typeof __DIB_PACKAGE_VERSION__ !== 'undefined'
    ? `react@${__DIB_PACKAGE_VERSION__}`
    : 'react';

function readEnv(key: string): string | undefined {
  // Check process.env (Node.js, SSR)
  // eslint-disable-next-line no-undef
  if (typeof process !== 'undefined' && process?.env) {
    // Check for exact key first
    const value = process.env[key];
    if (value) return value;

    // Check for NEXT_PUBLIC_ prefixed version (Next.js client-side)
    const nextPublicValue = process.env[`NEXT_PUBLIC_${key}`];
    if (nextPublicValue) return nextPublicValue;
  }

  // Check import.meta.env (Vite, build tools)
  // @ts-ignore - import.meta.env may not exist in all environments
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    const value = import.meta.env[key] ?? import.meta.env[`VITE_${key}`];
    if (value) return value;
  }

  return undefined;
}

// resolveConfig runs on every provider remount, so each deprecation is
// reported once per process rather than once per call.
const warned = new Set<string>();

function warnOnce(message: string): void {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[@dropinblog/react-core] ${message}`);
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
  // Props beat env vars; the current names beat the legacy ones they replaced.
  // Blank values fall through so a half-finished rename still authenticates.
  const apiKey =
    config.apiKey || config.apiToken || readEnv('DROPINBLOG_API_KEY') || readEnv('DROPINBLOG_API_TOKEN');

  if (!blogId) {
    throw new Error('A DropInBlog blogId is required. Set config.blogId, DROPINBLOG_BLOG_ID, or NEXT_PUBLIC_DROPINBLOG_BLOG_ID.');
  }
  if (!apiKey) {
    throw new Error(
      'A DropInBlog API key is required. Set config.apiKey, DROPINBLOG_API_KEY, or NEXT_PUBLIC_DROPINBLOG_API_KEY.'
    );
  }

  if (!config.apiKey) {
    if (config.apiToken) {
      warnOnce('The "apiToken" option is deprecated — rename it to "apiKey".');
    } else if (!readEnv('DROPINBLOG_API_KEY')) {
      warnOnce('DROPINBLOG_API_TOKEN is deprecated — rename it to DROPINBLOG_API_KEY.');
    }
  }

  const { basePath, baseSegment, baseParts } = normalizeBasePath(config.basePath);

  return {
    blogId,
    apiKey,
    basePath,
    baseSegment,
    baseParts,
    apiBaseUrl: (config.apiBaseUrl ?? DEFAULT_API_BASE_URL).replace(/\/$/, ''),
    fetchImpl: ensureFetch(config.fetchImpl),
    cacheTtlMs: config.cacheTtlMs ?? DEFAULT_CACHE_TTL,
    defaultFields: config.defaultFields ?? DEFAULT_FIELDS,
    packageSource: config.packageSource ?? DEFAULT_PACKAGE_SOURCE,
  };
}

export type { DropInBlogConfig } from './types';
