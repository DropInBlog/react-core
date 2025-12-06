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

## Requirements & guarantees

- Node.js ≥ 18 (for built-in `fetch`).
- React ≥ 18.2 with forward-compatibility for React 19.
- No dependencies on Express, Next.js, Remix, React Router, or Wouter.

## License

MIT © DropInBlog
