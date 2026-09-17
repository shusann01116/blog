# Task 2 report: minimal Start runtime

## Result

TanStack Start now builds beside the existing Next.js application. `/` is prerendered with the `Start migration preview` heading and the isolated Start stylesheet. The production preview returns HTTP 404 for `/not-a-route`. The existing `dev`, `build`, and `start` scripts remain Next.js commands; the Start commands use port 3101.

## Dependencies and runtime decisions

- Runtime: Node.js 24.21.0, pnpm 11.26.0.
- Exact runtime dependencies: `@tanstack/react-start@1.168.51`, `@tanstack/react-router@1.170.34`.
- Exact development dependencies: `vite@8.3.0`, `@vitejs/plugin-react@6.1.1`, `@cloudflare/vite-plugin@1.54.6`, `wrangler@4.130.0`, `@types/react-dom@19.2.3`.
- The first selected latest cohort was rejected by pnpm's 24-hour release-age policy. Its lockfile had 15 entries published after the `2026-09-16T02:36:51Z` cutoff. The lockfile was regenerated with the older exact cohort; no `minimumReleaseAgeExclude` entries remain.
- `workerd: true` is the sole new `allowBuilds` entry because Cloudflare's build and preview runtime requires its install script.
- The checked-in compatibility date is `2026-09-15`. The policy-mature Worker binary rejected `2026-09-16` because its latest supported date is `2026-09-15`; the first newer binary was still inside the release-age window. This choice preserves the package policy and does not affect this minimal route.
- Start uses ordinary SSR and prerendering. Experimental React Server Components are not enabled.

## TDD and verification evidence

The required pre-build existence check was run before implementation:

```text
$ test -f dist/client/index.html
exit 1
```

Fresh final checks used `PATH=/Users/shusann/.local/share/mise/installs/node/24.21.0/bin:$PATH`:

```text
$ pnpm build:start
exit 0; GET / 200 OK; prerendered 1 page: /

$ pnpm typecheck:start
exit 0

$ pnpm lint
exit 0

$ pnpm install --frozen-lockfile
exit 0; lockfile already up to date

$ pnpm preview:start
$ curl http://localhost:3101/
HTTP/1.1 200 OK; initial HTML contains Start migration preview and /assets/start-*.css

$ curl http://localhost:3101/not-a-route
HTTP/1.1 404 Not Found

$ TZ=UTC pnpm build
exit 0; Next compiled, typechecked, generated 13 static pages, and Pagefind indexed 10 pages
```

The first sandboxed Start build was denied an internal local port (`0.0.0.0:9229`); the same build passed with the required port permission. The first sandboxed Next builds waited while `next/font/google` could not access the network; the elevated build completed in 15.9 seconds. Nextra emitted existing worktree Git-timestamp warnings for MDX files, but the Next build completed successfully.

## Artifacts and boundaries

- Prerendered static root: `dist/client/index.html`
- Browser asset root: `dist/client/assets`
- Worker entry: `dist/server/index.js`
- Generated Worker configuration: `dist/server/wrangler.json`
- Generated configuration values: `main: index.js`, `assets.directory: ../client`, `assets.not_found_handling: none`
- Generated route tree: `src/routeTree.gen.ts` (generated locally by the Start plugin and ignored by Git)
- Next types: `tsconfig.next.json` includes `src/app`, `src/utils`, MDX setup, and `.next` generated types.
- Start types: `tsconfig.start.json` includes the router, generated route tree, and Start file routes while clearing the inherited Next TypeScript plugin and excluding Next sources.

The production Next server was restarted with `TZ=UTC` on port 3100 after its independent build. No deployment was attempted.
