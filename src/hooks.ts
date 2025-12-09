'use client';

import { useEffect, useMemo, useState } from 'react';
import { DropInBlogRouter } from './router';
import { RouteMatch, RouteResolution } from './types';
import { useDropInBlog } from './provider';

export interface RouteState {
  status: 'idle' | 'loading' | 'success' | 'error';
  match?: RouteMatch | null;
  resolution?: RouteResolution;
  error?: Error;
}

export function useDropInBlogRouterInstance(): DropInBlogRouter {
  const { router } = useDropInBlog();
  return router;
}

export function useDropInBlogMatch(pathname?: string | null): RouteMatch | null {
  const router = useDropInBlogRouterInstance();
  return useMemo(() => {
    if (!pathname) return null;
    return router.match(pathname);
  }, [pathname, router]);
}

export function useDropInBlogRoute(pathname?: string | null): RouteState {
  const router = useDropInBlogRouterInstance();
  const [state, setState] = useState<RouteState>({ status: 'idle' });

  useEffect(() => {
    if (!pathname) {
      setState({ status: 'idle', match: null });
      return;
    }

    const match = router.match(pathname);
    if (!match) {
      setState({ status: 'error', error: new Error(`No route matched ${pathname}`) });
      return;
    }

    let cancelled = false;
    setState({ status: 'loading', match });

    router
      .resolve(pathname)
      .then((resolution) => {
        if (cancelled) return;
        setState({ status: 'success', match: resolution.match, resolution });
      })
      .catch((error) => {
        if (cancelled) return;
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        setState({ status: 'error', error: normalizedError, match });
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return state;
}
