# TanStack Start Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 既存のブログ機能と公開 URL を維持し、Base UI を使ったシンプルな画面で TanStack Start を Cloudflare Workers に移行する。

**Architecture:** ビルド時に MDX を検証して記事情報と遅延 import の対応表を生成し、Start のルートから参照する。公開ページの事前生成後に Pagefind 索引を作成し、静的アセットと RSS などを扱う Worker を同時に配信する。Next.js は新構成の比較と切替が完了するまで保持する。

**Tech Stack:** React、TypeScript、TanStack Start / Router、Vite、Cloudflare Vite plugin / Wrangler、MDX、Base UI、Tailwind CSS、Pagefind、Vitest、Playwright。

**Spec:** [承認済み設計書](../specs/2026-09-16-tanstack-start-migration-design.md)

## Global Constraints

- Node.js 24.21.0、pnpm 11.26.0。
- 汎用の UI プリミティブは `@base-ui/react` を基盤に `src/shared/components` へ実装する。
- frontmatter の日付は、公開日を変えずに `YYYY-MM-DD` へ統一する。
- 全記事で `date: "YYYY-MM-DD"` の引用符付き文字列として記述する。
- 公開 origin は `https://blog.shusann01116.dev` に固定する。
- Next.js は比較検証が終わるまで起動可能に保つ。
- 実験的な React Server Components には依存しない。
- ISR、KV、D1、R2 は今回の構成に追加しない。
- プレビュー環境では本番への計測送信を無効にする。
- 既存記事の本文、slug、日付以外の frontmatter、画像 URL、日本語アンカーを維持する。
- 不明記事は HTTP 404、不明タグは空一覧の HTTP 200 とする。
- 現在は計画作成のみ。以下のコマンド、コード、テストは実装時に実行する。

## 実行順序と確認地点

タスク 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 の順に進める。
タスク 2 の Workers と事前生成の検証が通るまで、全ページの移植を始めない。
構成上の不適合が分かった場合は、バージョンと再現手順を記録し、SSR 化などの設計変更を先に合意する。
タスク 8 まででプレビュー検証済みの変更を作り、タスク 9 で本番切替と不要な依存の除去を行う。

各タスクは、意味のある失敗を再現するテスト、実装、成功の確認、対象ファイルだけのコミットで閉じる。
文書や単純な設定のためだけのテストは追加しない。
作業開始時に隔離された作業ブランチを用意し、承認済み設計書と本計画の両方を読む。

## ファイル構成と責務

| ファイル                                                          | 責務                                       |
| ----------------------------------------------------------------- | ------------------------------------------ |
| `scripts/migration/capture-baseline.ts`                           | 現行レスポンスの記録                       |
| `scripts/migration/convert-content.ts`                            | MDX の移植と日付統一                       |
| `scripts/content/build.ts`                                        | 検証、生成ファイルの書き出し               |
| `scripts/content/vite-plugin.ts`                                  | 開発中の追加、変更、削除に応じた再生成     |
| `scripts/build/search.ts`                                         | Pagefind の実行と配信成果物の検証          |
| `src/lib/post-schema.ts`                                          | frontmatter と日付の検証                   |
| `src/lib/post-types.ts`                                           | 記事の共通型                               |
| `src/lib/posts.ts`                                                | ソート、参照、タグ集計                     |
| `src/lib/site.ts`                                                 | 公開 origin、タイトル、計測 ID             |
| `src/lib/rss.ts`                                                  | RSS XML の生成                             |
| `src/generated/posts.ts`                                          | 記事メタデータの生成結果                   |
| `src/generated/post-loaders.ts`                                   | slug と MDX import の対応表                |
| `src/generated/pages.json`                                        | 事前生成対象の URL                         |
| `src/content/home.mdx`、`src/content/posts/*.mdx`                 | 移行後の編集元                             |
| `src/shared/components/{button,input,dialog}.tsx`                 | Base UI の汎用ラッパー                     |
| `src/components/{site-layout,post-card,post-body,code-block}.tsx` | ブログ表示                                 |
| `src/components/{search-dialog,theme-switch,analytics}.tsx`       | ブラウザで動く機能                         |
| `src/lib/{pagefind,theme,analytics}.ts`                           | 各機能の処理と型                           |
| `src/styles/start.css`                                            | 新しい画面のスタイル                       |
| `src/mdx/start-components.tsx`                                    | Start 側だけの MDX コンポーネント          |
| `src/routes/`、`src/router.tsx`                                   | Start のルートとルーター                   |
| `tests/unit/`、`tests/e2e/`                                       | データの検証と操作の回帰テスト             |
| `tests/fixtures/migration/`                                       | 公開動作の比較用データ                     |
| `docs/migration/`                                                 | 採用バージョン、配信設定、切替と復旧の記録 |

`src/generated` と `src/routeTree.gen.ts` は生成物として ignore し、build、dev、型チェックの前提となる生成コマンドを明示する。
Node.js のファイル処理は `scripts/` に閉じ込める。
ブラウザと Worker が import する `src/lib/posts.ts` から `node:fs` やビルド用パーサーを辿れない構成にする。

## Task 1: 現行ブログの比較基準を保存する

**Files:**

- Create: `scripts/migration/capture-baseline.ts`
- Create: `tests/fixtures/migration/baseline.json`
- Create: `tests/e2e/contracts.spec.ts`, `playwright.config.ts`
- Create: `docs/migration/baseline.md`
- Modify: `package.json`, `pnpm-lock.yaml`

**Interfaces:** `capture-baseline.ts --origin <URL> --output <file>` は公開 HTML、status、Location、head、見出し ID、RSS を取得する。`baseline.json` は `pages: { path, status, location, title, description, canonical, og, headingIds }[]` と `posts: { slug, title, date, tags, author, description }[]` を持つ。

- [ ] `pnpm add -DE @playwright/test tsx cheerio` を実行し、`pnpm exec playwright install chromium` でブラウザを用意する。既存の pnpm レジストリに接続できない場合は到達性を調べ、認証設定を別のホストへコピーしない。
- [ ] `pnpm build` と `pnpm exec next start -p 3100` で現行本番ビルドを起動する。失敗時はエラーを記録し、基準値の取得に失敗したまま先へ進めない。
- [ ] 全記事の slug を `src/app/posts/*/page.mdx` から取得する。`/`、`/posts`、全記事、`/tags/blog`、`/tags/book`、`/tags/not-a-tag`、`/posts/not-a-post`、`/not-a-route`、`/rss.xml`、`/robots.txt`、`/sitemap.xml`、`/favicon.ico`、`/imgs/lgtmoon-rs.png` を記録する。ページには末尾スラッシュ付きと `?q=test` の比較も加える。

```ts
const response = await fetch(new URL(path, origin), { redirect: "manual" });
const html = await response.text();
const $ = load(html); // cheerio の load を import
const snapshot = {
  path,
  status: response.status,
  location: response.headers.get("location"),
  title: $("title").text(),
  description: $('meta[name="description"]').attr("content") ?? null,
  canonical: $('link[rel="canonical"]').attr("href") ?? null,
  og: Object.fromEntries(
    $('meta[property^="og:"]')
      .toArray()
      .map((node) => [$(node).attr("property"), $(node).attr("content")]),
  ),
  headingIds: $("h1[id],h2[id],h3[id],h4[id]")
    .toArray()
    .map((node) => $(node).attr("id")),
};
```

- [ ] baseline が存在しない状態で比較テストを実行して失敗を確認し、記録を生成して同じ現行アプリに対する比較を通す。Playwright の `baseURL` は `process.env.TEST_ORIGIN ?? 'http://localhost:3101'` とし、Next.js と Start の双方に同じテストを実行できるようにする。

```ts
test("不明記事は HTTP 404", async ({ request }) => {
  expect((await request.get("/posts/not-a-post")).status()).toBe(404);
});
test("不明タグは空一覧", async ({ page }) => {
  const response = await page.goto("/tags/not-a-tag");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "not-a-tag",
  );
});
```

- [ ] `docs/migration/baseline.md` に公開設定の取得方法と、確認できた旧サービス名、ドメイン割当、旧デプロイ識別子を記録する。取得できない情報を推測せず、本番切替の前提として追跡する。
- [ ] `TEST_ORIGIN=http://localhost:3100 pnpm exec playwright test tests/e2e/contracts.spec.ts` を通し、公開データだけをコミットする。コミット名: `test: capture current blog behavior`。

## Task 2: Workers 上で最小の Start ページを事前生成する

**Files:**

- Create: `vite.config.ts`, `wrangler.jsonc`, `tsconfig.start.json`, `tsconfig.next.json`
- Create: `src/router.tsx`, `src/routes/__root.tsx`, `src/routes/index.tsx`
- Create: `src/styles/start.css`, `docs/migration/runtime.md`
- Modify: `package.json`, `pnpm-lock.yaml`, `next.config.mjs`, `.gitignore`

**Interfaces:** `dev:start` は port 3101、`build:start` は Start のみをビルド、`preview:start` は本番成果物を Workers 相当で起動する。元の `dev` / `build` / `start` はまだ変更しない。

- [ ] Start、Router、Vite、Cloudflare plugin の engines と peerDependencies を `pnpm view <package> engines peerDependencies --json` で確認し、既存 React / TypeScript と整合する組み合わせを `docs/migration/runtime.md` に記録する。依存は `pnpm add -E @tanstack/react-start @tanstack/react-router`、開発依存は `pnpm add -DE vite @vitejs/plugin-react @cloudflare/vite-plugin wrangler @types/react-dom` で exact 保存し、lockfile をコミットする。
- [ ] Next.js の tsconfig を専用設定に分け、`next.config.mjs` の `typescript.tsconfigPath` を `tsconfig.next.json` にする。Next.js 側は `src/app`、既存 utils、既存 MDX 設定と Next の生成型を include する。Start 側は新ルートと新コンポーネントだけを include し、`next` の TypeScript plugin、`next-env.d.ts`、既存 MDX 設定を含めない。
- [ ] 以下の最小構成を追加する。最初の事前生成対象は `/` だけとする。

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  server: { port: 3101 },
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart({
      prerender: { enabled: true, failOnError: true, crawlLinks: false },
      pages: [{ path: "/" }],
    }),
    react(),
  ],
});
```

```json
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "shusann-blog-start-preview",
  "main": "@tanstack/react-start/server-entry",
  "compatibility_date": "2026-09-16",
  "compatibility_flags": ["nodejs_compat"],
  "assets": { "not_found_handling": "none" }
}
```

- [ ] `getRouter()` は生成された `routeTree` を使い毎回 router を生成する。root は `HeadContent`、`Outlet`、`Scripts` を含む HTML ドキュメントを返す。index は固有の見出しを返す。`@/styles/start.css?url` を root の stylesheet link へ追加し、Nextra の CSS は読み込まない。

```tsx
// src/router.tsx
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
export function getRouter() {
  return createRouter({ routeTree, scrollRestoration: true });
}
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
```

```tsx
// src/routes/__root.tsx
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import styleUrl from "@/styles/start.css?url";
export const Route = createRootRoute({
  head: () => ({ links: [{ rel: "stylesheet", href: styleUrl }] }),
  component: () => (
    <html lang="ja">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  ),
});
// src/routes/index.tsx
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/")({
  component: () => <h1>Start migration preview</h1>,
});
```

- [ ] `build:start:app` を `vite build`、`build:start` を `pnpm build:start:app`、`dev:start` を `vite --port 3101`、`preview:start` を `vite preview --port 3101`、`typecheck:start` を `tsc -p tsconfig.start.json --noEmit` として追加する。
- [ ] ビルド前の HTML 存在チェックが失敗することを確認し、ビルド後の `/` の HTML と生成 Wrangler 設定を調べる。`dist/client` を想定したパスが実際の出力と一致するか検証し、実際のアセットルートと Worker 設定パスを runtime.md に記録する。後続タスクはこの値を使う。
- [ ] `pnpm build:start`、`pnpm typecheck:start`、`pnpm preview:start` で root が初期 HTML に存在することと `/not-a-route` が 404 になることを確認する。続けて現行の `pnpm build` も確認し、両方が独立して動くことを合格条件にする。コミット名: `build: add Start on Cloudflare alongside Next.js`。

## Task 3: 記事データ層と日付を移行する

**Files:**

- Create: `src/lib/post-types.ts`, `src/lib/post-schema.ts`, `src/lib/posts.ts`
- Create: `scripts/migration/convert-content.ts`, `scripts/content/build.ts`, `scripts/content/vite-plugin.ts`
- Create: `src/content/home.mdx`, `src/content/posts/*.mdx`, `src/mdx.d.ts`
- Create: `tests/unit/posts.test.ts`, `tests/unit/content.test.ts`, `vitest.config.ts`
- Generated: `src/generated/posts.ts`, `src/generated/post-loaders.ts`, `src/generated/pages.json`
- Modify: `package.json`, `pnpm-lock.yaml`, `vite.config.ts`, `.gitignore`

**Interfaces:**

```ts
// src/lib/post-types.ts
export interface PostMeta {
  slug: string;
  title: string;
  date: string; // 検証済み YYYY-MM-DD
  description: string;
  tags: string[];
  author: string;
  readingMinutes: number;
}
// post-schema.ts
export function validateDate(value: unknown): string;
export function parseFrontmatter(
  value: unknown,
  sourcePath: string,
): Omit<PostMeta, "slug" | "readingMinutes">;
// posts.ts
export function sortPosts(posts: readonly PostMeta[]): PostMeta[];
export function countTags(posts: readonly PostMeta[]): Record<string, number>;
export function getPosts(): PostMeta[];
export function getPost(slug: string): PostMeta | undefined;
export function getPostsByTag(tag: string): PostMeta[];
```

- [ ] `pnpm add -DE vitest @mdx-js/rollup @types/mdx remark-frontmatter remark-mdx-frontmatter remark-gfm rehype-slug rehype-pretty-code shiki gray-matter reading-time` を実行する。Vitest 設定は Workers や Start の plugin を読み込まず、`tests/unit/**/*.test.ts` を Node 環境で実行する。
- [ ] 次のテストを追加し、`pnpm exec vitest run tests/unit/posts.test.ts` が未実装の関数で失敗することを確認する。

```ts
import { expect, test } from "vitest";
import { validateDate } from "../../src/lib/post-schema";

test.each(["2024-09-21", "2024-02-29"])("日付を維持する: %s", (value) => {
  expect(validateDate(value)).toBe(value);
});
test.each([
  "2024/09/21",
  "2025-02-29",
  "2025-13-01",
  "",
  new Date("2024-09-21"),
])("不正日付を拒否する: %s", (value) => {
  expect(() => validateDate(value)).toThrow();
});
```

- [ ] `validateDate` は文字列、`/^\d{4}-\d{2}-\d{2}$/`、UTC の往復変換の順で検証する。frontmatter のタイトル、説明、著者は空文字を拒否し、tags は空でない文字列の配列に限定する。エラーには元ファイルを含める。

```ts
export function validateDate(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error("date must be YYYY-MM-DD");
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  )
    throw new Error("invalid calendar date");
  return value;
}
```

- [ ] 移植スクリプトは元の MDX の本文をバイト単位で維持し、frontmatter の `date:` 行だけを変更して `src/content/posts/<slug>.mdx` に書く。既存日付は次の変換表と一致させる。トップは `src/content/home.mdx` にコピーする。

| slug                      | 統一後の date  |
| ------------------------- | -------------- |
| `2024-09-21-first-post`   | `"2024-09-21"` |
| `2024-09-25-another-post` | `"2024-09-25"` |
| `2025-03-08`              | `"2025-03-08"` |
| `2025-05-17-2025-goals`   | `"2025-05-17"` |
| `2025-08-26`              | `"2025-08-26"` |
| `2026-03-14`              | `"2026-03-14"` |

- [ ] メタデータ、重複 slug の検証、読了時間、URL 一覧を生成する。`posts.ts` はメタデータだけを import する。本文の対応表は下記の形式で、MDX コンポーネントを eager import しない。

```ts
// 生成例。全 slug を同じ形式で出力する。
export const postLoaders = {
  "2024-09-21-first-post": () =>
    import("../content/posts/2024-09-21-first-post.mdx"),
};
```

- [ ] `pages.json` は `/`、`/posts`、記事パス、符号化したタグパスを持つ `{ path: string }[]` とする。重複タグを除く。開発用 plugin は `src/content` の追加、変更、削除を監視し、再生成してから full reload を通知する。削除した記事が生成表に残らないことを検証する。
- [ ] 本文と日付以外の frontmatter が旧ファイルと一致するテスト、日付降順、同日 slug 順、タグ件数 `{ blog: 5, book: 1 }`、重複 slug、読了時間が有限の正整数になるテストを加える。`pnpm exec vitest run tests/unit/posts.test.ts tests/unit/content.test.ts` を通す。
- [ ] `content:build` を `tsx scripts/content/build.ts` にし、dev と build の前に実行する。生成物はコミットせず、編集元、生成スクリプト、検証をコミットする。コミット名: `feat: migrate MDX content with normalized dates`。

## Task 4: MDX をルートへ接続し RSS と head を移植する

**Files:**

- Create: `src/routes/posts.index.tsx`, `src/routes/posts.$slug.tsx`, `src/routes/tags.$tag.tsx`, `src/routes/rss[.]xml.ts`
- Create: `src/lib/site.ts`, `src/lib/rss.ts`, `src/mdx/start-components.tsx`
- Create: `src/components/post-card.tsx`, `src/components/post-body.tsx`, `src/components/code-block.tsx`
- Create: `tests/unit/rss.test.ts`, `tests/e2e/content.spec.ts`
- Modify: `src/routes/index.tsx`, `src/routes/__root.tsx`, `vite.config.ts`, `tests/e2e/contracts.spec.ts`

**Interfaces:** `renderRss(posts: readonly PostMeta[]): string` は site 設定から RSS を生成する。`PostBody({ slug }: { slug: string })` は対応する遅延 MDX を表示する。ルートの loader 戻り値は JSON 化可能な `PostMeta` だけにする。

- [ ] MDX plugin は `src/content/**/*.mdx` のみに適用し、frontmatter、GFM、slug、コードハイライトを設定する。Next 用 `src/mdx-components.mjs` と分離し、Start 用コンポーネントは MDX の `components` prop で渡す。

```ts
// vite.config.ts に import と plugin を追加する。
import mdx from "@mdx-js/rollup";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";

const mdxPlugin = mdx({
  include: "**/src/content/**/*.mdx",
  remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm],
  rehypePlugins: [
    rehypeSlug,
    [
      rehypePrettyCode,
      { theme: { light: "github-light", dark: "github-dark" } },
    ],
  ],
});
// mdxPlugin は React plugin より前に置き、React plugin の include に /\.(mdx|[jt]sx?)$/ を指定する。
```

- [ ] 既存日本語アンカー、画像、iframe、コードを含む記事への Playwright テストを追加し、現状の Start に対して失敗を確認する。

```ts
test("日本語見出しへの既存リンクを維持する", async ({ page }) => {
  await page.goto("/posts/2025-08-26");
  await page.getByRole("link", { name: "以前の記事" }).click();
  const id = decodeURIComponent(new URL(page.url()).hash.slice(1));
  expect(id.length).toBeGreaterThan(0);
  expect(
    await page.evaluate(
      (headingId) => document.getElementById(headingId) !== null,
      id,
    ),
  ).toBe(true);
});
```

- [ ] 記事ルートは `getPost(params.slug)` がない場合 `notFound()` を投げる。metadata を loader から head に渡す。MDX コンポーネントは loader の戻り値に含めず、生成表から作った `React.lazy` と `Suspense` を使い、初期 HTML に本文があることを実際に確認する。
- [ ] タグ一覧は `getPostsByTag(params.tag)` を使い、復号済みの params を再度 `decodeURIComponent` しない。内部リンクは Router の `Link` と型付き params を使い、RSS、外部 URL、画像 URL は通常の URL として扱う。
- [ ] root に共通 title と favicon、記事に現行相当の title、description、OG、canonical を設定する。baseline に robots や sitemap が存在した場合は `src/routes/robots[.]txt.ts`、`src/routes/sitemap[.]xml.ts` で対応し、元の公開 URL 集合を維持する。
- [ ] RSS の XML エスケープをテストしてから実装する。公開日は明示した UTC 時刻で出力する。

```ts
// rss.ts の文字列処理
const escapeXml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
// tests/unit/rss.test.ts の入力
const post = {
  slug: "xml-test",
  title: "A & B <C>",
  date: "2024-09-21",
  description: '"引用"',
  tags: ["blog"],
  author: "shusann01116",
  readingMinutes: 1,
};
expect(renderRss([post])).toContain("A &amp; B &lt;C&gt;");
expect(renderRss([post])).toContain("Sat, 21 Sep 2024 00:00:00 GMT");
```

- [ ] `rss[.]xml.ts` に `createFileRoute('/rss.xml')` の `server.handlers.GET` を設定し、`new Response(renderRss(getPosts()), { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } })` を返す。
- [ ] `pnpm build:start`、`pnpm typecheck:start`、RSS の単体テスト、`TEST_ORIGIN=http://localhost:3101 pnpm exec playwright test tests/e2e/contracts.spec.ts tests/e2e/content.spec.ts` を通す。コミット名: `feat: preserve blog routes RSS and metadata in Start`。

## Task 5: Base UI のプリミティブでブログの画面を構成する

**Files:**

- Create: `src/shared/components/button.tsx`, `src/shared/components/input.tsx`, `src/shared/components/dialog.tsx`
- Create: `src/components/site-layout.tsx`, `src/components/theme-switch.tsx`, `src/lib/theme.ts`
- Create: `tests/e2e/theme.spec.ts`
- Modify: `src/styles/start.css`, `src/routes/__root.tsx`, `src/components/post-card.tsx`, `src/components/code-block.tsx`, `package.json`, `pnpm-lock.yaml`

**Interfaces:** Button と Input は Base UI の props を受け、Dialog は Root、Trigger、Portal、Backdrop、Popup、Title、Close を公開する。ThemeSwitch は props 不要、SiteLayout は `children: ReactNode` を受ける。

- [ ] `pnpm add -E @base-ui/react @fontsource/noto-sans-jp` を実行する。必要なプリミティブだけを実装する。

```tsx
// src/shared/components/button.tsx
import { Button as BaseButton } from "@base-ui/react/button";
import type { ComponentProps } from "react";

export function Button({
  className = "",
  ...props
}: ComponentProps<typeof BaseButton>) {
  return (
    <BaseButton
      {...props}
      className={`rounded px-3 py-2 focus-visible:outline-2 disabled:opacity-50 ${className}`}
    />
  );
}
```

- [ ] Input と Dialog も Base UI の props とアクセシビリティ属性を透過する。Dialog はタイトルを関連付け、ポータルの重なり順を root の `isolation: isolate` と合わせる。shared 内に posts、Pagefind、Router、GA の import がないことをレビューする。
- [ ] SiteLayout は Home、Posts、検索用の操作領域、テーマ切替、既存の5つの SNS / RSS リンクを表示する。本文最大幅を約 48rem、モバイル余白を 1rem とし、記事カードはタイトル、説明、公開日、タグ、読了時間を表示する。既存 iframe のアスペクト比と画像の最大幅を維持する。
- [ ] テーマ保存のテストを先に追加する。ボタンの accessible name は「テーマを切り替え」にする。

```ts
test("テーマを再読み込み後も維持する", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await page.getByRole("button", { name: "テーマを切り替え" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
});
```

- [ ] 初期表示前のスクリプトは localStorage の `theme`（light / dark）を読み、未設定なら matchMedia を使う。storage が利用できない場合は例外を捕捉して OS 設定を使う。React の初期描画で window を参照せず、変更後は html の class と color-scheme を更新する。
- [ ] Noto Sans JP の 400 / 700 の CSS を自己配信用パッケージから import する。Google へのフォントリクエストがないことを確認する。コードコピーはボタンで起動し、成功と失敗を `aria-live` で伝える。
- [ ] `pnpm exec playwright test tests/e2e/theme.spec.ts tests/e2e/content.spec.ts` を実行し、390px と 1280px の viewport で本文と操作のはみ出しを確認する。コミット名: `feat: build blog UI on Base UI primitives`。

## Task 6: 事前生成と Pagefind の配信を完成させる

**Files:**

- Create: `scripts/build/search.ts`, `src/lib/pagefind.ts`, `src/components/search-dialog.tsx`
- Create: `tests/e2e/search.spec.ts`
- Modify: `vite.config.ts`, `package.json`, `src/components/site-layout.tsx`, `src/components/post-body.tsx`

**Interfaces:** `searchPosts(query: string): Promise<{ url: string; title: string; excerpt: string }[]>`。`SearchDialog()` は遅延読み込み、検索結果、エラーと再試行を担当する。

- [ ] `vite.config.ts` の pages を生成した `pages.json` に変更する。`prerender.enabled` と `failOnError` を true にし、crawler に依存せず全対象を列挙する。記事本文を `data-pagefind-body` で囲み、ナビゲーションと一覧を `data-pagefind-ignore` にする。
- [ ] search スクリプトはタスク 2 で確認したアセットルートを使い、すべての記事の生成 HTML の存在を検証してから Pagefind を実行する。起動時に `.next` やソースの public を誤って参照した場合は失敗させる。

```ts
import { spawnSync } from "node:child_process";
import { access } from "node:fs/promises";
import { join } from "node:path";

// タスク 2 の成果物確認により dist/client であることを検証してから固定する。
const assetRoot = "dist/client";
const result = spawnSync(
  "pnpm",
  [
    "exec",
    "pagefind",
    "--site",
    assetRoot,
    "--output-path",
    join(assetRoot, "_pagefind"),
  ],
  { stdio: "inherit" },
);
if (result.status !== 0) throw new Error("Pagefind indexing failed");
await access(join(assetRoot, "_pagefind/pagefind.js"));
```

- [ ] `build:start` を `pnpm content:build && vite build && tsx scripts/build/search.ts && pnpm typecheck:start` にする。古い成果物を削除して実行し、全 10 ページ（トップ、一覧、記事6、タグ2）と索引が新しく生成されることを確認する。Next 用の postbuild はこのコマンドから呼ばない。
- [ ] Pagefind は初回の検索ダイアログ操作時に読み込む。ダイアログは shared の部品を使用し、検索ボックス名を「記事を検索」、開くボタンを「検索」とする。検索結果の excerpt を未検証の HTML として注入しない。

```ts
// pagefind.ts の遅延読み込み部分
const url = "/_pagefind/pagefind.js";
const pagefind = await import(/* @vite-ignore */ url);
const result = await pagefind.search(query);
const items = await Promise.all(
  result.results.slice(0, 20).map(
    (entry: {
      data: () => Promise<{
        url: string;
        meta: { title?: string };
        excerpt: string;
      }>;
    }) => entry.data(),
  ),
);
```

- [ ] 空欄、0件、読み込み中、失敗、再試行を表示する。連続検索はリクエスト番号で古い結果を捨て、閉じた後の state 更新を防ぐ。失敗した import の Promise を保持し続けず、再試行で再取得できるようにする。
- [ ] 索引生成前に検索テストが失敗することを確認し、生成後は次を通す。ネットワークを一度失敗させて再試行するケースと Escape で閉じた後のフォーカス復帰も加える。

```ts
test("日本語検索から記事へ移動する", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "検索", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "記事を検索" })
    .fill("ヒューリスティック");
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "ヒューリスティックをコントロールしたい" })
    .click();
  await expect(page).toHaveURL(/\/posts\/2026-03-14/);
});
```

- [ ] `pnpm build:start` と本番 preview に対する `pnpm exec playwright test tests/e2e/search.spec.ts` を通す。コミット名: `feat: index prerendered articles with Pagefind`。

## Task 7: 計測とエラー表示を接続する

**Files:**

- Create: `src/lib/analytics.ts`, `src/components/analytics.tsx`, `src/components/error-view.tsx`
- Create: `tests/unit/analytics.test.ts`, `tests/e2e/errors.spec.ts`
- Modify: `src/lib/site.ts`, `src/routes/__root.tsx`, `src/router.tsx`

**Interfaces:** `shouldTrack(origin: string, enabled: boolean): boolean`、`trackPageView(url: string, title: string): void`。計測 ID は `G-2NJX07FBDF`。環境変数 `VITE_ENABLE_ANALYTICS` は本番ビルドだけ true にする。

- [ ] `shouldTrack` のテストを追加して失敗を確認する。本番 origin と有効フラグの両方を要求する。

```ts
expect(shouldTrack("https://blog.shusann01116.dev", true)).toBe(true);
expect(shouldTrack("http://localhost:3101", true)).toBe(false);
expect(shouldTrack("https://blog.shusann01116.dev", false)).toBe(false);
```

- [ ] Analytics はブラウザ側で gtag を一度だけ初期化し、`send_page_view: false` を設定する。初回と Router の遷移完了後に page_view を送り、同じ URL の effect 重複では送らない。後で同じ URL に戻った場合は新しい閲覧として扱う。

```ts
gtag("config", "G-2NJX07FBDF", { send_page_view: false });
gtag("event", "page_view", { page_location: url, page_title: title });
```

- [ ] GA 側の履歴変更による自動 page_view 設定も確認し、手動送信との二重計測を避ける。テストは gtag の呼び出しを stub して初回1回、別ページ1回、戻る1回を検証し、実際の GA へテストデータを送らない。
- [ ] root の notFoundComponent と errorComponent を設け、404 はホームへのリンク、予期しないエラーは再試行を提供する。検索失敗は SearchDialog 内で処理する。hydration エラーを console/pageerror から収集し、主要導線のテストを失敗させる。
- [ ] `pnpm exec vitest run tests/unit/analytics.test.ts` と `pnpm exec playwright test tests/e2e/errors.spec.ts` を通す。コミット名: `feat: preserve analytics and error behavior`。

## Task 8: Cloudflare プレビューで比較を完了する

**Files:**

- Create: `docs/migration/verification.md`, `docs/migration/cutover.md`
- Modify: `wrangler.jsonc`, `docs/migration/runtime.md`, `tests/e2e/contracts.spec.ts`

**Interfaces:** 同じ `TEST_ORIGIN` でローカル preview と Cloudflare のプレビュー URL を検証する。プレビュー用 Worker は本番ドメインに紐付けない。

- [ ] `pnpm content:build`、`pnpm exec vitest run`、`pnpm build:start`、`pnpm lint`、`pnpm exec prettier --check` を変更対象へ実行する。生成物を lint 対象から除外し、新規コードの問題と既存の問題を区別して記録する。
- [ ] 最新のローカル成果物に対する全 Playwright テストを実行する。初期 HTML、head、各記事の日付、RSS、タグ件数、既存の日本語アンカーを baseline と比較する。見た目の差は許容するが、内容の差は説明できるものだけにする。
- [ ] Wrangler の生成設定がプレビュー Worker を指していることを確認し、完成した成果物を `pnpm exec wrangler deploy` でプレビューへ公開する。公開 URL と deployment ID を記録する。
- [ ] `TEST_ORIGIN` に実際のプレビュー URL を設定し、`pnpm exec playwright test` を実行する。`/_pagefind/pagefind.js` と分割索引、画像、フォントの取得、RSS の MIME、未知 URL の status を検証する。
- [ ] アセットの優先順位と末尾スラッシュのリダイレクトを確認する。`assets.not_found_handling` は `none` を維持し、既存の静的ファイルが見つからない場合に Worker のルーティングが動くことを確認する。既知 HTML の配信を意図せず Worker 必須にしない。
- [ ] 記事を一時的に変更したプレビュービルドで、本文と検索結果が同じ版になることを確認し、その試験変更を元に戻してから最終成果物を作る。
- [ ] verification.md に実行コマンド、対象コミット、結果、残っている差分を記録する。cutover.md に現在のサービス種別、旧 deployment ID、ドメイン設定、新 Worker 名、復旧操作を具体的に記録する。値を取得できない場合は本番切替を未完了として扱う。
- [ ] 記録と設定だけをコミットする。コミット名: `docs: record Cloudflare migration verification`。

## Task 9: 本番を切り替えて Next.js を除去する

**Files:**

- Modify: `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.json`, `.oxlintrc.json`, `.gitignore`, `CLAUDE.md`, `wrangler.jsonc`, `docs/migration/cutover.md`
- Remove after cutover: `src/app/`, `src/utils/get-posts.ts`, `src/mdx-components.mjs`, `src/styles/global.css`, `next.config.mjs`, `next-env.d.ts`, `tsconfig.next.json`

**Interfaces:** 最終的な `dev`、`build`、`preview` は Start 用。`deploy` は検証済みの build を経て Wrangler を実行する。旧デプロイはコードから Next.js を除去しても復旧可能な形で保持する。

- [ ] タスク 8 の比較結果と具体的なドメイン切替操作を提示し、実行セッションの公開権限を確認する。現時点の設計承認を本番ドメイン変更の実施記録として扱わない。
- [ ] analytics フラグを有効にした本番用成果物を作り、旧配信を残したまま新 Worker を用意する。記録した Cloudflare のカスタムドメインまたは route 設定で切り替える。
- [ ] 本番の `/`、`/posts`、全記事、全タグ、RSS、404、検索を確認する。主要ページの 5xx、本文欠落、RSS または検索の配信失敗があれば、cutover.md の旧ドメイン設定と旧 deployment に戻す。時刻と結果を記録する。
- [ ] 動作確認後に Next.js のディレクトリと設定を除去する。`pnpm remove next @next/third-parties nextra nextra-theme-blog` を実行し、sharp は使用箇所がないことを `rg -n 'sharp' src scripts package.json` で確認してから削除する。
- [ ] package scripts を下記の最終形へ整理する。`postbuild` の Next 用 Pagefind は削除する。

```json
{
  "dev": "pnpm content:build && vite --port 3101",
  "build": "pnpm content:build && vite build && tsx scripts/build/search.ts && pnpm typecheck",
  "preview": "vite preview --port 3101",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:e2e": "playwright test",
  "deploy": "pnpm build && wrangler deploy",
  "content:build": "tsx scripts/content/build.ts"
}
```

- [ ] Start の tsconfig をルートへ統合する。oxlint の nextjs plugin と Next 用 ignore を除去する。CLAUDE.md の「src/app は async Server Component」という説明、コマンド、記事配置、日付、Base UI の配置、デプロイ手順を更新する。`pnpm-workspace.yaml` のビルド許可は実際に必要なパッケージだけに絞る。
- [ ] `pnpm install --frozen-lockfile`、`pnpm test`、`pnpm build`、`pnpm lint` と最終成果物に対する全ブラウザテストを通す。`rg -n 'next/|nextra|@next/' src scripts package.json` に実行依存が残っていないことを確認する。コミット名: `chore: retire Next.js after verified cutover`。

## 設計との対応と完了判定

| 承認済み要件                                  | 対応タスク |
| --------------------------------------------- | ---------- |
| URL と公開動作の維持、並行比較                | 1、2、4、8 |
| MDX、日付統一、記事データの分離               | 3、4       |
| Base UI と shared/components                  | 5、6       |
| 1 カラム、フォント、SNS、テーマ、コードコピー | 5          |
| 初期 HTML、head、RSS、404                     | 2、4、7、8 |
| 事前生成、Pagefind、更新の一貫性              | 2、6、8    |
| 計測、エラー処理                              | 6、7       |
| Cloudflare の検証と切り戻し                   | 8、9       |
| 不要な依存と文書の更新                        | 9          |

全チェックボックスを完了するまで、移行完了とはしない。
本番切替の実施前で作業を区切る場合は「プレビュー検証済み」として報告する。
計画作成時点では依存のインストール、テスト、Start のビルド、Cloudflare への配信を実施していない。
パッケージ番号とプラグインの組み合わせはタスク 2 で exact 固定し、未検証の互換性を成功扱いにしない。

## 公式資料

- [Next.js からの移行](https://tanstack.com/start/latest/docs/framework/react/migrate-from-next-js)
- [Start の基本構成](https://tanstack.com/start/latest/docs/framework/react/build-from-scratch)
- [Workers 向け構成](https://tanstack.com/start/latest/docs/framework/react/guide/hosting#cloudflare-workers--official-partner)
- [事前生成](https://tanstack.com/start/latest/docs/framework/react/guide/static-prerendering)
- [Cloudflare Vite plugin の静的アセット](https://developers.cloudflare.com/workers/vite-plugin/reference/static-assets/)
- [MDX の Vite plugin](https://mdxjs.com/packages/rollup/)
- [Base UI の導入](https://base-ui.com/react/overview/quick-start)
- [Base UI Dialog](https://base-ui.com/react/components/dialog)
- [Pagefind の検索 API](https://pagefind.app/docs/api/)
