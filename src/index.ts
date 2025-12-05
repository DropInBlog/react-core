export { DropInBlogClient } from './client';
export { DropInBlogProvider, useDropInBlog } from './provider';
export { DropInBlogContent, DropInBlogHead } from './components';
export {
  useDropInBlogRoute,
  useDropInBlogMatch,
  useDropInBlogRouterInstance,
} from './hooks';
export { buildHeadDescriptors, applyHeadData, DROPINBLOG_MANAGED_ATTR } from './head';
export { matchRoute, buildRoute, normalizePathname } from './routes';
export { createDropInBlogRouter } from './router';
export { resolveConfig } from './config';
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
export type { RouteState } from './hooks';

import { DropInBlogClient } from './client';
import { resolveConfig } from './config';
import { createDropInBlogRouter } from './router';
import { DropInBlogConfig } from './types';

export function createDropInBlogCore(config: DropInBlogConfig = {}) {
  const resolvedConfig = resolveConfig(config);
  const client = new DropInBlogClient(resolvedConfig);
  const router = createDropInBlogRouter(resolvedConfig, client);
  return { config: resolvedConfig, client, router };
}
