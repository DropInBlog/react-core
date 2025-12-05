import { HeadData, HeadItem, HeadItems, MaybeArray } from './types';

export interface HeadDescriptor {
  tag: string;
  attributes?: Record<string, string>;
  content?: string;
}

const MANAGED_ATTR = 'data-dropinblog-managed';
const PERSIST_ATTR = 'data-dropinblog-persist';
const loadedExternalScripts = new Set<string>();

const toArray = (value?: MaybeArray<string>): string[] => {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value];
};

const pushMeta = (
  descriptors: HeadDescriptor[],
  attributes: Record<string, string | undefined>
) => {
  const sanitized = Object.fromEntries(
    Object.entries(attributes).filter(([, val]) => val !== undefined && val !== null)
  ) as Record<string, string>;
  if (Object.keys(sanitized).length) {
    descriptors.push({ tag: 'meta', attributes: sanitized });
  }
};

const pushLink = (
  descriptors: HeadDescriptor[],
  attributes: Record<string, string | undefined>
) => {
  const sanitized = Object.fromEntries(
    Object.entries(attributes).filter(([, val]) => val !== undefined && val !== null)
  ) as Record<string, string>;
  if (Object.keys(sanitized).length) {
    descriptors.push({ tag: 'link', attributes: sanitized });
  }
};

const isHeadItem = (value: unknown): value is HeadItem => {
  return Boolean(value && typeof value === 'object' && 'tag' in (value as HeadItem));
};

const normalizeHeadItems = (headItems?: HeadItems): HeadItem[] => {
  if (!headItems) return [];

  const result: HeadItem[] = [];
  const pushValue = (value: unknown) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(pushValue);
      return;
    }
    if (isHeadItem(value)) {
      result.push(value);
    }
  };

  if (Array.isArray(headItems)) {
    headItems.forEach(pushValue);
  } else if (typeof headItems === 'object') {
    Object.values(headItems).forEach(pushValue);
  }

  return result;
};

const serializeAttributes = (attributes?: Record<string, string>) => {
  if (!attributes) return '';
  return Object.entries(attributes)
    .filter(([key]) => key !== MANAGED_ATTR)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join(';');
};

const descriptorSignature = (descriptor: HeadDescriptor) => {
  const tag = descriptor.tag.toLowerCase();
  const attrs = serializeAttributes(descriptor.attributes);
  const content = descriptor.content ?? '';
  return `${tag}|${attrs}|${content}`;
};

interface ManagedDocument extends Document {
  __dropinblogHeadSignature?: string;
}

export function buildHeadDescriptors(
  headData?: HeadData,
  headItemsInput?: HeadItems
): HeadDescriptor[] {
  const descriptors: HeadDescriptor[] = [];
  const headItems = normalizeHeadItems(headItemsInput);

  headItems.forEach((item) => {
    if (!item.tag) return;
    descriptors.push({
      tag: item.tag,
      attributes: item.attributes,
      content: item.content,
    });
  });

  if (!headData) return descriptors;

  if (headData.title) {
    descriptors.push({ tag: 'title', content: headData.title });
  }

  if (headData.description) {
    pushMeta(descriptors, { name: 'description', content: headData.description });
  }

  if (headData['og:title']) {
    pushMeta(descriptors, { property: 'og:title', content: headData['og:title'] });
  }

  if (headData['og:description']) {
    pushMeta(descriptors, {
      property: 'og:description',
      content: headData['og:description'],
    });
  }

  if (headData['og:image']) {
    pushMeta(descriptors, { property: 'og:image', content: headData['og:image'] });
  }

  if (headData['twitter:title']) {
    pushMeta(descriptors, {
      name: 'twitter:title',
      content: headData['twitter:title'],
    });
  }

  if (headData['twitter:description']) {
    pushMeta(descriptors, {
      name: 'twitter:description',
      content: headData['twitter:description'],
    });
  }

  if (headData['twitter:image']) {
    pushMeta(descriptors, {
      name: 'twitter:image',
      content: headData['twitter:image'],
    });
  }

  if (headData.canonical_url) {
    pushLink(descriptors, { rel: 'canonical', href: headData.canonical_url });
  }

  if (headData.rss_url) {
    pushLink(descriptors, {
      rel: 'alternate',
      type: 'application/rss+xml',
      href: headData.rss_url,
    });
  }

  if (headData.seo_url_next) {
    pushLink(descriptors, { rel: 'next', href: headData.seo_url_next });
  }

  if (headData.seo_url_prev) {
    pushLink(descriptors, { rel: 'prev', href: headData.seo_url_prev });
  }

  if (headData.noindex) {
    pushMeta(descriptors, {
      name: 'robots',
      content: 'noindex, nofollow',
    });
  }

  toArray(headData.fonts).forEach((href) => {
    pushLink(descriptors, {
      rel: 'stylesheet',
      href,
    });
  });

  toArray(headData.js).forEach((src) => {
    descriptors.push({
      tag: 'script',
      attributes: { src, defer: 'true' },
    });
  });

  toArray(headData.css).forEach((css) => {
    descriptors.push({ tag: 'style', content: css });
  });

  if (headData.schema) {
    const content =
      typeof headData.schema === 'string'
        ? headData.schema
        : JSON.stringify(headData.schema);
    descriptors.push({
      tag: 'script',
      attributes: { type: 'application/ld+json' },
      content,
    });
  }

  return descriptors;
}

function getDocument(target?: Document) {
  if (target) return target;
  if (typeof document !== 'undefined') {
    return document;
  }
  return undefined;
}

function createElement(doc: Document, descriptor: HeadDescriptor) {
  const tag = descriptor.tag.toLowerCase();
  if (tag === 'script') {
    const src = descriptor.attributes?.src;
    if (src) {
      if (loadedExternalScripts.has(src)) {
        return null;
      }
      loadedExternalScripts.add(src);
    }
  }

  const el = doc.createElement(descriptor.tag);
  el.setAttribute(MANAGED_ATTR, 'true');
  if (descriptor.attributes) {
    Object.entries(descriptor.attributes).forEach(([key, value]) => {
      el.setAttribute(key, value);
    });
  }
  if (tag === 'script' && descriptor.attributes?.src) {
    el.setAttribute(PERSIST_ATTR, 'true');
  }
  if (descriptor.content !== undefined) {
    el.textContent = descriptor.content;
  }
  return el;
}

export function applyHeadData(
  headData?: HeadData,
  options: { headItems?: HeadItems; document?: Document } = {}
) {
  const descriptors = buildHeadDescriptors(headData, options.headItems);
  if (!headData && descriptors.length === 0) return;

  const doc = getDocument(options.document);
  if (!doc) return;
  const managedDoc = doc as ManagedDocument;
  const head = doc.head ?? doc.getElementsByTagName('head')[0];
  if (!head) return;

  const signature = JSON.stringify({
    title: headData?.title ?? '',
    descriptors: descriptors.map(descriptorSignature),
  });

  if (managedDoc.__dropinblogHeadSignature === signature) {
    return;
  }

  head.querySelectorAll(`[${MANAGED_ATTR}]`).forEach((node) => {
    if (node.getAttribute(PERSIST_ATTR) === 'true') return;
    node.remove();
  });

  if (headData?.title) {
    head.querySelectorAll('title').forEach((node) => node.remove());
    doc.title = headData.title;
  }

  if (!descriptors.length) {
    managedDoc.__dropinblogHeadSignature = signature;
    return;
  }

  descriptors.forEach((descriptor) => {
    const element = createElement(doc, descriptor);
    if (!element) return;
    head.appendChild(element);
  });

  managedDoc.__dropinblogHeadSignature = signature;
}

export { MANAGED_ATTR as DROPINBLOG_MANAGED_ATTR };
