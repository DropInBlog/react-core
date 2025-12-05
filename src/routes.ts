import { RouteKind, RouteMatch, ResolvedDropInBlogConfig } from './types';

const RESERVED_POST_SLUGS = new Set(['page', 'category', 'author']);

type RouteVariant = 'default' | 'page';

interface RouteDefinition {
  kind: RouteKind;
  variant: RouteVariant;
  pattern: RegExp;
  parse: (match: RegExpExecArray, pathname: string) => RouteMatch | null;
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ensureLeadingSlash = (value: string) => (value.startsWith('/') ? value : `/${value}`);

const buildBasePrefix = (config: ResolvedDropInBlogConfig) => {
  const parts = config.baseParts.map(escapeRegExp);
  return ensureLeadingSlash(parts.join('/'));
};

const stripTrailingSlash = (path: string) =>
  path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;

export function normalizePathname(pathname: string) {
  if (!pathname) return '/';
  const trimmed = pathname.split('?')[0].split('#')[0];
  if (!trimmed.startsWith('/')) return `/${trimmed}`;
  return trimmed === '/' ? '/' : stripTrailingSlash(trimmed);
}

function createRouteDefinitions(config: ResolvedDropInBlogConfig): RouteDefinition[] {
  const basePrefix = buildBasePrefix(config);

  return [
    {
      kind: 'main-list',
      variant: 'default',
      pattern: new RegExp(`^${basePrefix}/?$`, 'i'),
      parse: (_match, pathname) => ({ kind: 'main-list', pathname, page: 1 }),
    },
    {
      kind: 'main-list',
      variant: 'page',
      pattern: new RegExp(`^${basePrefix}/page/(\\d+)/?$`, 'i'),
      parse: (match, pathname) => ({
        kind: 'main-list',
        pathname,
        page: Number(match[1]) || 1,
      }),
    },
    {
      kind: 'category-list',
      variant: 'default',
      pattern: new RegExp(`^${basePrefix}/category/([^/]+)/?$`, 'i'),
      parse: (match, pathname) => ({
        kind: 'category-list',
        pathname,
        params: { slug: decodeURIComponent(match[1]) },
        page: 1,
      }),
    },
    {
      kind: 'category-list',
      variant: 'page',
      pattern: new RegExp(`^${basePrefix}/category/([^/]+)/page/(\\d+)/?$`, 'i'),
      parse: (match, pathname) => ({
        kind: 'category-list',
        pathname,
        params: { slug: decodeURIComponent(match[1]) },
        page: Number(match[2]) || 1,
      }),
    },
    {
      kind: 'author-list',
      variant: 'default',
      pattern: new RegExp(`^${basePrefix}/author/([^/]+)/?$`, 'i'),
      parse: (match, pathname) => ({
        kind: 'author-list',
        pathname,
        params: { slug: decodeURIComponent(match[1]) },
        page: 1,
      }),
    },
    {
      kind: 'author-list',
      variant: 'page',
      pattern: new RegExp(`^${basePrefix}/author/([^/]+)/page/(\\d+)/?$`, 'i'),
      parse: (match, pathname) => ({
        kind: 'author-list',
        pathname,
        params: { slug: decodeURIComponent(match[1]) },
        page: Number(match[2]) || 1,
      }),
    },
    {
      kind: 'post',
      variant: 'default',
      pattern: new RegExp(`^${basePrefix}/([^/]+)/?$`, 'i'),
      parse: (match, pathname) => {
        const slug = decodeURIComponent(match[1]);
        if (RESERVED_POST_SLUGS.has(slug)) return null;
        return {
          kind: 'post',
          pathname,
          params: { slug },
        };
      },
    },
  ];
}

export function matchRoute(
  pathname: string,
  config: ResolvedDropInBlogConfig
): RouteMatch | null {
  const normalized = normalizePathname(pathname);
  const definitions = createRouteDefinitions(config);

  for (const definition of definitions) {
    const match = definition.pattern.exec(normalized);
    if (!match) continue;
    const parsed = definition.parse(match, normalized);
    if (parsed) return parsed;
  }

  return null;
}

export function buildRoute(
  kind: RouteKind,
  config: ResolvedDropInBlogConfig,
  params: { slug?: string; page?: number } = {}
) {
  const basePrefix = ensureLeadingSlash(config.baseSegment);

  switch (kind) {
    case 'main-list':
      if (params.page && params.page > 1) {
        return `${basePrefix}/page/${params.page}`;
      }
      return basePrefix;
    case 'category-list': {
      const { slug } = params;
      if (!slug) throw new Error('Category routes require a slug');
      const encoded = encodeURIComponent(slug);
      if (params.page && params.page > 1) {
        return `${basePrefix}/category/${encoded}/page/${params.page}`;
      }
      return `${basePrefix}/category/${encoded}`;
    }
    case 'author-list': {
      const { slug } = params;
      if (!slug) throw new Error('Author routes require a slug');
      const encoded = encodeURIComponent(slug);
      if (params.page && params.page > 1) {
        return `${basePrefix}/author/${encoded}/page/${params.page}`;
      }
      return `${basePrefix}/author/${encoded}`;
    }
    case 'post': {
      const { slug } = params;
      if (!slug) throw new Error('Post routes require a slug');
      if (RESERVED_POST_SLUGS.has(slug)) {
        throw new Error(`"${slug}" is reserved and cannot be used as a post slug.`);
      }
      return `${basePrefix}/${encodeURIComponent(slug)}`;
    }
    default:
      throw new Error(`Unknown route kind: ${kind}`);
  }
}
