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
# or
pnpm add @dropinblog/react-core
```

## Configuration

Set your credentials in the environment (recommended):

```bash
# .env
DROPINBLOG_BLOG_ID=your_dropinblog_id
DROPINBLOG_API_TOKEN=your_dropinblog_api_token
DROPINBLOG_BASE_PATH=news
```



The provider automatically loads credentials from the environment when `blogId` and `apiToken` props are omitted.

## Routing primitives

`@dropinblog/react-core` ships a mini-router independent of any framework.

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
