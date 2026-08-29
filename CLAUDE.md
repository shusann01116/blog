# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal blog built with **Next.js 16** + **Nextra 4** (MDX blog theme). Content is written in MDX with YAML frontmatter. The site is deployed at `https://blog.shusann01116.dev`.

## Commands

| Command         | Description                                                                  |
| --------------- | ---------------------------------------------------------------------------- |
| `aube dev`      | Start dev server (Turbopack)                                                 |
| `aube build`    | Production build (runs `next build`, then Pagefind indexing via `postbuild`) |
| `aube lint`     | oxlint (config in `.oxlintrc.json`)                                          |
| `aube lint:fix` | oxlint with autofix — see the Server Components caveat below                 |
| `aube format`   | Prettier formatting                                                          |

Package manager is **pnpm 11** (enforced via `packageManager` field). Do not use npm or yarn.

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
- `src/mdx-components.mjs` — MDX component overrides (Nextra 4 replaced `theme.config.jsx`; theme
  customization now lives in `src/app/layout.tsx` via `<Layout>`, `<Navbar>`, `<Footer>`)

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
- oxlint config lives in `.oxlintrc.json` with the `correctness`, `perf`, and `suspicious`
  categories set to `error`, and type-aware linting enabled via `oxlint-tsgolint`
- Nextra config in `next.config.mjs` enables copy-code buttons and reading time
- Lefthook pre-commit hook runs Prettier on staged files (`lefthook.yml`)
- Content is primarily in Japanese

### Renovate must stay behind pnpm's `minimumReleaseAge`

pnpm 11 enforces a supply-chain policy that rejects any lockfile entry published within the
last **24 hours** (`minimumReleaseAge`, default `1440` minutes). It fails `pnpm install` outright
with `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`, so a Renovate PR raised right after a release
breaks the Vercel deployment during install — before the build ever starts.

`renovate.json` therefore sets `minimumReleaseAge: "3 days"`, which keeps every lockfile Renovate
writes comfortably past pnpm's cutoff. Never lower it below pnpm's own setting.

### Never use React hooks to satisfy `react-perf` lint rules

Everything under `src/app/` is an **async Server Component**, where React hooks do not exist.
The `react-perf/jsx-no-new-object-as-prop` rule (enabled via the `perf` category) flags inline
object literals passed as JSX props. Fix it by hoisting the object to a **module-scope
constant** — never by wrapping it in `useMemo`.

A `useMemo` placed _before_ the component's first `await` appears to work, because the async
function's synchronous prologue still runs inside React's render scope. Placed _after_ an
`await`, it crashes the production prerender with
`TypeError: Cannot read properties of null (reading 'useMemo')`, since React has already torn
down the hook dispatcher. Be especially careful with `aube lint:fix`, which can reintroduce this.
