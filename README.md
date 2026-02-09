# @dropinblog/react-core

Framework agnostic React helpers, router utilities, and an API client for the DropInBlog.

## Features

- **Router aware** – built-in route matching for blog posts, categories, authors, and pagination with customizable base paths.
- **Lightweight API client** – fetches rendered content and metadata with automatic caching.
- **Head and body rendering** – components for managing SEO tags and rendering blog content.

## Installation

```bash
npm install @dropinblog/react-core
# or
yarn add @dropinblog/react-core
```

## Configuration

Set your credentials in the environment (recommended):

```bash
# For Node.js / SSR environments
DROPINBLOG_BLOG_ID=your_dropinblog_blog_id
DROPINBLOG_API_TOKEN=your_dropinblog_api_token

# For Vite / browser-only builds, add VITE_ prefix
VITE_DROPINBLOG_BLOG_ID=your_dropinblog_blog_id
VITE_DROPINBLOG_API_TOKEN=your_dropinblog_api_token
```

## Routing

`@dropinblog/react-core` ships a mini-router independent of any framework.

**Note:** If you're already using [wouter](https://github.com/molefrog/wouter) in your app, use our wouter integration package `@dropinblog/react-wouter` instead.

Supported route patterns (base path defaults to `/blog` but is configurable):

- `/blog`
- `/blog/page/{page}`
- `/blog/category/{slug}`
- `/blog/category/{slug}/page/{page}`
- `/blog/author/{slug}`
- `/blog/author/{slug}/page/{page}`
- `/blog/{article-slug}`

## Usage

### Provider Setup

Wrap your app (or blog section) with `DropInBlogProvider`. When environment variables are set, no props are needed:

```tsx
import { DropInBlogProvider } from "@dropinblog/react-core";

function App() {
  return (
    <DropInBlogProvider>
      <BlogPage />
    </DropInBlogProvider>
  );
}
```

You can also pass credentials and options explicitly:

```tsx
<DropInBlogProvider
  blogId="your_blog_id"
  apiToken="your_api_token"
  basePath="/news"        {/* default: "/blog" */}
  cacheTtlMs={60_000}     {/* default: 5 minutes */}
>
  <BlogPage />
</DropInBlogProvider>
```

### `useDropInBlogRoute` — fetch and render a route

The primary hook. Pass the current pathname and it matches a route, fetches data, and returns everything you need to render.

```tsx
import {
  useDropInBlogRoute,
  DropInBlogContent,
  DropInBlogHead,
} from "@dropinblog/react-core";

function BlogPage() {
  const pathname = window.location.pathname; // or useLocation(), etc.
  const { status, resolution, error } = useDropInBlogRoute(pathname);

  if (status === "loading") return <p>Loading…</p>;
  if (status === "error") return <p>Error: {error?.message}</p>;
  if (status !== "success" || !resolution) return null;

  const { body_html, head_data, head_items } = resolution.payload;

  return (
    <>
      <DropInBlogHead headData={head_data} headItems={head_items} />
      <DropInBlogContent bodyHtml={body_html} />
    </>
  );
}
```

`resolution.match` tells you which route was matched:

```ts
resolution.match.kind;     // "main-list" | "category-list" | "author-list" | "post"
resolution.match.params;   // { slug?: string }
resolution.match.page;     // number (for paginated routes)
```

### `useDropInBlogMatch` — lightweight route matching

Synchronously checks if a pathname matches a blog route **without** fetching any data. Useful for conditional rendering or active nav links.

```tsx
import { useDropInBlogMatch } from "@dropinblog/react-core";

function NavLink() {
  const match = useDropInBlogMatch(window.location.pathname);

  return (
    <a href="/blog" className={match ? "active" : ""}>
      Blog
    </a>
  );
}
```

Returns a `RouteMatch` (with `kind`, `params`, `page`) or `null` if the pathname doesn't match any blog route.

### `useDropInBlog` — access the context directly

Returns the provider context for advanced use cases like calling the API client manually.

```tsx
import { useDropInBlog } from "@dropinblog/react-core";

function LatestPost() {
  const { client } = useDropInBlog();

  useEffect(() => {
    client.fetchPost("my-post-slug").then((res) => {
      // res.body_html, res.head_data, etc.
    });
  }, []);

  // ...
}
```

The returned object contains:

- **`config`** — resolved configuration (blogId, basePath, etc.)
- **`client`** — API client with methods like `fetchPost()`, `fetchCategory()`, `fetchAuthor()`, `fetchMainList()`, and `clearCache()`
- **`router`** — router instance used for route matching

### Components

#### `DropInBlogContent`

Renders the blog HTML body.

```tsx
<DropInBlogContent
  bodyHtml={resolution.payload.body_html}
  as="section"        {/* "article" (default) | "section" | "div" */}
  className="my-blog"
/>
```

Accepts all standard HTML element props (`className`, `id`, `style`, etc.). Inline scripts in the HTML are automatically executed.

#### `DropInBlogHead`

Manages SEO meta tags, JSON-LD schema, stylesheets, and fonts in the document `<head>`.

```tsx
<DropInBlogHead
  headData={resolution.payload.head_data}
  headItems={resolution.payload.head_items}
  immediate={true}  {/* default: true — apply to <head> via DOM */}
/>
```

- **`immediate={true}`** (default) — writes tags directly to `document.head` and returns `null`. Best for SPAs.
- **`immediate={false}`** — returns React elements instead, for frameworks that manage `<head>` themselves.

## Requirements & guarantees

- Node.js ≥ 18 (for built-in `fetch`).
- React ≥ 18.2 with forward-compatibility for React 19.
- No dependencies on Express, Next.js, Remix, React Router, or Wouter.

## License

MIT © DropInBlog
