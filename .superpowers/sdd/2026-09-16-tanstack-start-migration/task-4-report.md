# Task 4 report

## Result

- Added the Start routes for `/posts`, `/posts/$slug`, `/tags/$tag`, and `/rss.xml`, and rendered the preserved home and article MDX through Start-specific components.
- Preserved the captured public contract: all 43 response variants, six article metadata records, RSS values and order, clean-URL 308 redirects, unknown article 404s, unknown tag empty 200s, favicon, and the observed robots/sitemap 404s.
- Added common title/favicon metadata and the captured article title/description metadata. The baseline contained no Open Graph, canonical, robots, or sitemap output, so none was invented.
- Article loaders return only JSON-serializable `PostMeta`. They preload the generated MDX module so the initial HTML contains the article body and client-side hash navigation scrolls to the lazy article content; the component itself remains in the generated lazy-loader map.
- Added article prerendering for all six current MDX files. With `autoSubfolderIndex: false`, the production artifacts are `dist/client/posts/<slug>.html`, matching the clean public URLs while allowing `_redirects` to preserve trailing-slash 308 behavior.

## TDD evidence

RSS RED:

```text
pnpm exec vitest run tests/unit/rss.test.ts
```

Result: the suite failed because `src/lib/rss.ts` did not exist.

Route RED against the Task 3 Start preview:

```text
TEST_ORIGIN=http://localhost:3102 pnpm exec playwright test tests/e2e/content.spec.ts
```

Result: the JavaScript-disabled request to `/posts/2025-08-26` expected 200 and received 404.

The first production build failed on raw frontmatter because Vite 8 placed the normal-phase MDX transform after React's pre transforms. Isolating the MDX plugin and inspecting resolved plugin order confirmed the cause; setting this narrowly scoped plugin to `enforce: "pre"` made MDX compile before React.

The first route/content comparison produced 31/58 passing tests and exposed redirect, article heading, and hash-navigation differences. After preserving clean URLs and baseline headings, the corrected hash test waited for the destination URL and heading and then failed for the full retry window because the hash scroll ran before the lazy MDX body resolved. Preloading the generated module in the article loader fixed the cause while retaining normal SPA navigation. The focused anchor test passed 1/1, then the complete route/content suite passed 58/58.

## Verification

```text
pnpm typecheck:start
# pass

pnpm exec vitest run tests/unit/rss.test.ts
# 1 file, 2 tests passed

pnpm lint
# pass

pnpm build:start
# pass; client + SSR build and 7 pages prerendered

TEST_ORIGIN=http://localhost:3101 pnpm exec playwright test tests/e2e/contracts.spec.ts tests/e2e/content.spec.ts
# 58 tests passed

git diff --check
# pass
```

The browser suite checks all captured responses and metadata, parsed RSS fields/order and MIME essence, semantic tag and author extraction, the exact Japanese anchor target and scrolling, images, iframe, code, unknown route behavior, and visibly rendered article text with JavaScript disabled.

## Files and interfaces

- `src/lib/site.ts`: captured site origin, title, description, and RSS language.
- `src/lib/rss.ts`: `renderRss(posts: readonly PostMeta[]): string`, including XML escaping and explicit UTC publication dates.
- `src/components/post-body.tsx`: `PostBody({ slug })` and route-time module preloading backed by generated `postLoaders`.
- `src/mdx/start-components.tsx`: Start-only MDX components for typed internal post/tag links, root/posts links, external anchors, headings, and highlighted code blocks.
- `src/routes/posts.index.tsx`: posts and tag-count listing.
- `src/routes/posts.$slug.tsx`: article metadata loader/head/body and `notFound()` for unknown slugs.
- `src/routes/tags.$tag.tsx`: decoded router param lookup without a second decode; unknown tags render an empty list.
- `src/routes/rss[.]xml.ts`: RSS server handler with `application/rss+xml; charset=utf-8`.
- `public/_redirects` and the root `beforeLoad`: Cloudflare static-asset and Worker fallbacks for the captured trailing-slash 308 redirects.
- `vite.config.ts`: content-only MDX pipeline, React MDX transform, and article prerender entries.
- `tests/unit/rss.test.ts`, `tests/e2e/content.spec.ts`, `tests/e2e/contracts.spec.ts`: RSS unit coverage plus public-contract and real-browser content coverage.

## Handoff and concerns

- Task 6 should consume the actual clean-URL artifact layout: root is `dist/client/index.html`, while articles are `dist/client/posts/<slug>.html`. It should not assume `<slug>/index.html`.
- This task prerenders the six article pages needed for static serving and reliable no-JavaScript article bodies. The generated `pages.json` remains the canonical list for the later full home/posts/tag integration; `/posts` and `/tags/*` are still Worker-rendered here.
- `_redirects` handles known static assets before they are served; the root `beforeLoad` preserves the same 308 behavior for Worker-rendered and unknown routes.
- A fresh Start production preview is live on port `3101` in exec session `47685` for review and the Task 5 handoff. The original Next production server on port `3100` was not changed by this task.
