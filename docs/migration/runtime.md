# Start runtime

The migration runs TanStack Start beside the existing Next.js application. Next continues to use the repository `dev`, `build`, and `start` commands. Start uses the dedicated `dev:start`, `build:start`, `preview:start`, and `typecheck:start` commands on port 3101.

## Version selection

Registry metadata was checked on 2026-09-17 with Node.js 24.21.0 and pnpm 11.26.0.

| Package                   | Version  | Relevant requirements                                                                      |
| ------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| `@tanstack/react-start`   | 1.168.51 | Node `>=22.12.0`, React 18 or 19, Vite `>=7`                                               |
| `@tanstack/react-router`  | 1.170.34 | Node `>=20.19`, React 18 or 19                                                             |
| `vite`                    | 8.3.0    | Node 20.19.0 or 22.12.0 and later; installed TypeScript and `tsx` satisfy its active peers |
| `@vitejs/plugin-react`    | 6.1.1    | Node 20.19.0 or 22.12.0 and later, Vite 8                                                  |
| `@cloudflare/vite-plugin` | 1.54.6   | Vite 6.1, 7, or 8; Wrangler `^4.130.0`                                                     |
| `wrangler`                | 4.130.0  | Node `>=22`; Workers types are an optional development peer for this runtime               |
| `@types/react-dom`        | 19.2.3   | `@types/react ^19.2.0`, matching the existing 19.2.18 types                                |

These versions match the existing React 19.2.8 runtime and run on the repository's pinned Node.js 24.21.0. pnpm 11.26.0 defaults `minimum-release-age` to 1,440 minutes (24 hours). The Start and Router releases were published on 2026-09-09, while the Cloudflare plugin and Wrangler cohort was published by 2026-09-08. This keeps the new packages outside that review window without adding `minimumReleaseAgeExclude` exceptions. The workspace allows the exact transitive `workerd` install script because Wrangler and the Cloudflare Vite plugin execute that local Workers runtime for build and preview.

The Worker compatibility date is `2026-09-15`. The pinned Cloudflare cohort supports and has been built, locally previewed, and dry-run bundled with this date. The application does not require behavior from a newer compatibility date, so upgrades can follow the normal dependency review instead of bypassing pnpm's release-age policy.

## TypeScript boundaries

Next uses `tsconfig.next.json`, including `src/app`, `src/utils`, the existing MDX component configuration, and generated Next types. Start uses `tsconfig.start.json`, including its runtime libraries, generated content metadata, router factory, generated route tree, and file routes. Imported Start components and MDX modules are checked through that graph. The Start config clears the inherited Next TypeScript plugin and excludes `next-env.d.ts` and `src/app`.

## Build artifacts

`pnpm build:start` regenerates content metadata, builds Start, rebuilds Pagefind, and runs the Start type check. It writes 10 clean-URL documents as `dist/client/index.html`, `posts.html`, `posts/*.html`, and `tags/*.html`. Pagefind reads only this new `dist/client` tree and indexes the six article bodies. The separate `public/_pagefind` directory remains the retained Next.js artifact until cutover.

The Worker bundle entry is `dist/server/index.js`. The Cloudflare plugin writes its resolved configuration to `dist/server/wrangler.json`; that file sets `main` to `index.js` and `assets.directory` to `../client`, both relative to `dist/server`. Publication and dry-run commands must pass this generated configuration explicitly.

The checked-in `wrangler.jsonc` remains the source configuration. It names `shusann-blog-start-preview`, enables workers.dev and version preview URLs, and defines no route or custom domain. Its `assets.not_found_handling` is `none`. Existing static files are served before the Worker by the default asset priority, while asset misses reach Start and preserve its HTTP 404 response.
