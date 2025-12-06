import React, { ReactNode, useEffect, useRef, forwardRef } from 'react';
import { applyHeadData, buildHeadDescriptors, HeadDescriptor } from './head';
import { HeadData, HeadItems } from './types';

type ContentTag = 'article' | 'section' | 'div';

export interface DropInBlogContentProps
  extends React.HTMLAttributes<HTMLElement> {
  as?: ContentTag;
  bodyHtml?: string;
  children?: ReactNode;
}

const INLINE_SIGNATURE_ATTR = 'data-dropinblog-inline-signature';
const INLINE_SCRIPT_ATTR = 'data-dropinblog-script-executed';
const executedInlineScripts = new Set<string>();

const hashBodyHtml = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString();
};

export const DropInBlogContent = forwardRef<HTMLElement, DropInBlogContentProps>(
  ({
    as = 'article',
    bodyHtml,
    children,
    ...rest
  }, forwardedRef) => {
    const containerRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
      if (!bodyHtml) return;
      const node = containerRef.current;
      if (!node) return;
      const signature = hashBodyHtml(bodyHtml);
      if (node.getAttribute(INLINE_SIGNATURE_ATTR) === signature) {
        return;
      }
      const scripts = Array.from(node.querySelectorAll('script'));
      scripts.forEach((script) => {
        if (script.hasAttribute('src')) return;
        const content = script.textContent?.trim();
        if (!content) return;
        const scriptHash = hashBodyHtml(content);
        if (script.getAttribute(INLINE_SCRIPT_ATTR) === 'true' || executedInlineScripts.has(scriptHash)) {
          return;
        }
        try {
          const fn = new Function(content);
          fn.call(window);
          script.setAttribute(INLINE_SCRIPT_ATTR, 'true');
          executedInlineScripts.add(scriptHash);
        } catch (error) {
          console.error('Failed to execute DropInBlog inline script', error);
        }
      });
      node.setAttribute(INLINE_SIGNATURE_ATTR, signature);
    }, [bodyHtml]);

    const setRef = (node: HTMLElement | null) => {
      containerRef.current = node;
      if (!forwardedRef) return;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (typeof forwardedRef === 'object') {
        (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    };

    if (children) {
      return React.createElement(as, { ...rest, ref: setRef }, children);
    }

    return React.createElement(as, {
      ...rest,
      ref: setRef,
      dangerouslySetInnerHTML: bodyHtml ? { __html: bodyHtml } : undefined,
      suppressHydrationWarning: true,
    });
  }
);

DropInBlogContent.displayName = 'DropInBlogContent';

export interface DropInBlogHeadProps {
  headData?: HeadData;
  headItems?: HeadItems;
  immediate?: boolean;
}

const BOOLEAN_ATTRIBUTES = new Set(['defer', 'async', 'nomodule']);

const normalizeReactAttributes = (attributes?: Record<string, string>) => {
  if (!attributes) return undefined;
  const normalized: Record<string, unknown> = {};
  Object.entries(attributes).forEach(([name, value]) => {
    if (BOOLEAN_ATTRIBUTES.has(name)) {
      normalized[name] = value !== 'false';
    } else {
      normalized[name] = value;
    }
  });
  return normalized;
};

const descriptorToElement = (descriptor: HeadDescriptor, key: string) => {
  const attrs = normalizeReactAttributes(descriptor.attributes) ?? {};

  if (descriptor.tag === 'title') {
    return (
      <title key={key} {...attrs}>
        {descriptor.content}
      </title>
    );
  }

  if (descriptor.tag === 'style' || descriptor.tag === 'script') {
    const dangerouslySetInnerHTML =
      descriptor.content !== undefined ? { __html: descriptor.content } : undefined;
    return React.createElement(descriptor.tag, {
      key,
      ...attrs,
      dangerouslySetInnerHTML,
      suppressHydrationWarning: true,
    });
  }

  if (descriptor.content) {
    return React.createElement(descriptor.tag, { key, ...attrs }, descriptor.content);
  }

  return React.createElement(descriptor.tag, { key, ...attrs });
};

export const DropInBlogHead: React.FC<DropInBlogHeadProps> = ({
  headData,
  headItems,
  immediate = true,
}) => {
  const descriptors = buildHeadDescriptors(headData, headItems);

  useEffect(() => {
    if (!immediate) return;
    applyHeadData(headData, { headItems });
  }, [immediate, headData, headItems]);

  if (immediate || !descriptors.length) return null;

  return (
    <>
      {descriptors.map((descriptor, index) =>
        descriptorToElement(descriptor, `dib-head-${index}`)
      )}
    </>
  );
};
