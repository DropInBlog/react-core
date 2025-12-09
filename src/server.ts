// Server-safe exports for Next.js and other SSR frameworks
export { DropInBlogClient } from './client';
export { buildHeadDescriptors, DROPINBLOG_MANAGED_ATTR } from './head';
export { matchRoute, buildRoute, normalizePathname } from './routes';
export type {
  DropInBlogConfig,
  ResolvedDropInBlogConfig,
  HeadData,
  HeadItem,
  HeadItems,
  RouteKind,
  RouteMatch,
  RouteResolution,
  RenderedResponse,
} from './types';
export type { HeadDescriptor } from './head';
