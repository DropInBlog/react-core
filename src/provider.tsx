'use client';

import React, { ReactNode, createContext, useContext, useMemo } from 'react';
import { DropInBlogClient } from './client';
import { resolveConfig } from './config';
import { createDropInBlogRouter, DropInBlogRouter } from './router';
import { DropInBlogConfig, ResolvedDropInBlogConfig } from './types';

export interface DropInBlogProviderProps extends DropInBlogConfig {
  children: ReactNode;
}

export interface DropInBlogContextValue {
  config: ResolvedDropInBlogConfig;
  client: DropInBlogClient;
  router: DropInBlogRouter;
}

const DropInBlogContext = createContext<DropInBlogContextValue | null>(null);

export const DropInBlogProvider: React.FC<DropInBlogProviderProps> = ({
  children,
  ...config
}) => {
  const resolvedConfig = useMemo(() => resolveConfig(config), [
    config.blogId,
    config.apiToken,
    config.basePath,
    config.apiBaseUrl,
    config.cacheTtlMs,
    config.defaultFields?.join(','),
    config.fetchImpl,
  ]);

  const client = useMemo(() => new DropInBlogClient(resolvedConfig), [resolvedConfig]);
  const router = useMemo(
    () => createDropInBlogRouter(resolvedConfig, client),
    [resolvedConfig, client]
  );

  const value = useMemo<DropInBlogContextValue>(
    () => ({ config: resolvedConfig, client, router }),
    [resolvedConfig, client, router]
  );

  return <DropInBlogContext.Provider value={value}>{children}</DropInBlogContext.Provider>;
};

export function useDropInBlog() {
  const context = useContext(DropInBlogContext);
  if (!context) {
    throw new Error('useDropInBlog must be used within a DropInBlogProvider');
  }
  return context;
}
