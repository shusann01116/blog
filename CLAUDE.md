# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal blog built with **Next.js 16** + **Nextra 4** (MDX blog theme). Content is written in MDX with YAML frontmatter. The site is deployed at `https://blog.shusann01116.dev`.

## Commands

| Command       | Description                                                                  |
| ------------- | ---------------------------------------------------------------------------- |
| `pnpm dev`    | Start dev server (Turbopack)                                                 |
| `pnpm build`  | Production build (runs `next build`, then Pagefind indexing via `postbuild`) |
| `pnpm lint`   | ESLint (flat config, v9)                                                     |
| `pnpm format` | Prettier formatting                                                          |

Package manager is **pnpm 10** (enforced via `packageManager` field). Do not use npm or yarn.

There are no tests configured in this project.

## Architecture

- **Framework**: Next.js App Router with Nextra (`nextra-theme-blog`) for MDX content
- **Styling**: Tailwind CSS v4 via PostCSS, plus Nextra theme styles
- **Search**: Pagefind generates a static search index at build time from `.next/server/app` into `public/_pagefind`
- **Analytics**: Google Analytics via `@next/third-parties`

### Key directories

- `src/app/` — Next.js App Router pages and layouts
- `src/app/posts/[slug]/page.mdx` — Blog posts (MDX with frontmatter)
- `src/app/tags/[tag]/page.tsx` — Dynamic tag filtering pages
- `src/app/rss.xml/route.ts` — RSS feed route handler
- `src/utils/get-posts.ts` — Post fetching/sorting utility using Nextra's `getPageMap`
- `theme.config.jsx` — Nextra theme customization (header, footer, dark mode)

### Blog post format

Posts live in `src/app/posts/<date-slug>/page.mdx` with frontmatter:

```yaml
---
title: Post Title
date: YYYY/MM/DD
description: Short description
tags: [tag1, tag2]
author: shusann01116
---
```

### Path alias

`@/*` maps to `./src/*` (configured in tsconfig.json).

## Configuration notes

- TypeScript strict mode is enabled
- ESLint uses flat config format (`eslint.config.mjs`), ignoring `.next/`, `node_modules/`, `_pagefind/`
- Nextra config in `next.config.mjs` enables copy-code buttons and reading time
- Husky pre-commit hook is configured
- Content is primarily in Japanese
