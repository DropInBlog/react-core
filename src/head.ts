import { HeadData, HeadItem, HeadItems, MaybeArray, ScriptDescriptor } from './types';

export interface HeadDescriptor {
  tag: string;
  attributes?: Record<string, string>;
  content?: string;
}

const MANAGED_ATTR = 'data-dropinblog-managed';
const PERSIST_ATTR = 'data-dropinblog-persist';
const loadedExternalScripts = new Set<string>();

const toArray = <T>(value?: MaybeArray<T>): T[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((item): item is T => item !== undefined && item !== null);
  }
  return [value];
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

const normalizeScriptAttributes = (entry: ScriptDescriptor) => {
  if (typeof entry === 'string') {
    return { src: entry, defer: 'true' } as Record<string, string>;
  }

  const attributes: Record<string, string> = {};
  Object.entries(entry).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'boolean') {
      attributes[key] = value ? 'true' : 'false';
    } else {
      attributes[key] = value;
    }
  });

  if (!attributes.src) {
    throw new Error('Script descriptor requires a src attribute.');
  }

  if (!('defer' in attributes) && attributes.type !== 'module') {
    attributes.defer = 'true';
  }

  return attributes;
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
    pushMeta(descriptors, { property: 'og:title', content: headData.title });
    pushMeta(descriptors, { name: 'twitter:title', content: headData.title });
  }

  if (headData.description) {
    pushMeta(descriptors, { name: 'description', content: headData.description });
    pushMeta(descriptors, { property: 'og:description', content: headData.description });
    pushMeta(descriptors, { name: 'twitter:description', content: headData.description });
  }

  if (headData.image) {
    pushMeta(descriptors, { property: 'og:image', content: headData.image });
    pushMeta(descriptors, { name: 'twitter:image', content: headData.image });
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

  toArray(headData.js).forEach((script) => {
    try {
      const attributes = normalizeScriptAttributes(script);
      descriptors.push({
        tag: 'script',
        attributes,
      });
    } catch (error) {
      console.error('Failed to normalize DropInBlog script descriptor', error);
    }
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

function removeConflictingElement(head: HTMLHeadElement, descriptor: HeadDescriptor) {
  const tag = descriptor.tag.toLowerCase();

  if (tag === 'meta') {
    const name = descriptor.attributes?.name;
    const property = descriptor.attributes?.property;

    if (name) {
      head.querySelectorAll(`meta[name="${name}"]`).forEach((node) => {
        if (!node.hasAttribute(MANAGED_ATTR)) {
          node.remove();
        }
      });
    } else if (property) {
      head.querySelectorAll(`meta[property="${property}"]`).forEach((node) => {
        if (!node.hasAttribute(MANAGED_ATTR)) {
          node.remove();
        }
      });
    }
  } else if (tag === 'link') {
    const rel = descriptor.attributes?.rel;
    if (rel) {
      head.querySelectorAll(`link[rel="${rel}"]`).forEach((node) => {
        if (!node.hasAttribute(MANAGED_ATTR)) {
          node.remove();
        }
      });
    }
  } else if (tag === 'title') {
      head.querySelectorAll('title').forEach((node) => {
          if (!node.hasAttribute(MANAGED_ATTR)) {
              node.remove();
          }
      });
  }

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

  if (!descriptors.length) {
    managedDoc.__dropinblogHeadSignature = signature;
    return;
  }

  descriptors.forEach((descriptor) => {
    removeConflictingElement(head, descriptor);
    const element = createElement(doc, descriptor);
    if (!element) return;
    head.appendChild(element);
  });

  managedDoc.__dropinblogHeadSignature = signature;
}

export { MANAGED_ATTR as DROPINBLOG_MANAGED_ATTR };
