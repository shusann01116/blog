# TanStack Start 移行検証記録

## 検証対象

タスク 7 完了コミット `24dfd6b37fd04fa6d8c011bbd58a6645afd5a232` を基点に、タスク 8 と最終レビュー修正を含む作業ツリーを検証した。
実行環境は Node.js 24.21.0、pnpm 11.26.0、`TZ=UTC` を明示した場合の Next.js ビルドである。
最終的な Start 成果物では `VITE_ENABLE_ANALYTICS` を設定していないため、計測は無効である。

## ローカル検証

以下のコマンドでは、先頭に `PATH=/Users/shusann/.local/share/mise/installs/node/24.21.0/bin:$PATH` を付けた。

```sh
pnpm content:build
pnpm exec vitest run
TZ=UTC pnpm build
pnpm build:start
pnpm lint
pnpm exec prettier --check \
  src/components/code-block.tsx \
  src/lib/pagefind.ts \
  src/lib/posts.ts \
  src/styles/start.css \
  tests/unit/posts.test.ts \
  tests/e2e/contracts.spec.ts \
  tests/e2e/search.spec.ts \
  tests/e2e/theme.spec.ts \
  wrangler.jsonc \
  docs/migration/runtime.md \
  docs/migration/verification.md \
  docs/migration/cutover.md \
  docs/superpowers/plans/2026-09-16-tanstack-start-migration.md
# 別ターミナルで起動し、この後の Playwright が終わるまで維持する
pnpm preview:start
# 元のターミナルで実行する
TEST_ORIGIN=http://localhost:3101 pnpm exec playwright test --reporter=line
pnpm exec wrangler deploy --dry-run --config dist/server/wrangler.json
git diff --check
```

確認結果は次のとおりである。

- Vitest は 4 ファイル、29 テストが成功した。`constructor` と `__proto__` をタグとして数える回帰テストを含む。
- Next.js の独立ビルドは 13 ルートを生成し、Next.js 用 Pagefind は 10 ページを索引した。Nextra が Git worktree 内の最終更新時刻を取得できない警告は、移行前から記録している worktree 固有の制限である。
- Start ビルドはトップ、記事一覧、6 記事、2 タグの合計 10 ページを事前生成した。Pagefind は旧 `public/_pagefind` を消費せず、同じ `dist/client` にある 6 記事の本文 1,490 語を索引した。
- 最終成果物には `.html` が 10 個あり、一時検証用の文字列が残っていない。
- ローカル preview に対するデフォルト Playwright は 80 テストが成功し、1 テストをスキップした。スキップ対象は明示的に計測を有効にした専用ビルドを必要とするため、デフォルト成果物では実行しないタスク 7 の analytics テストである。タスク 7 ではこの専用テスト 1 件が成功済みで、GTM をローカルで応答し `gtag` を stub 化したため、実際の GA collection endpoint へは送信していない。
- Playwright は初期 HTML、head、全記事の日付とメタデータ、RSS の MIME と内容、タグ件数、日本語アンカー、404、308 リダイレクトを旧基準と比較した。画像、ビルド時に決まる CSS とフォント、Pagefind のローダーと分割索引と記事フラグメントも HTTP 200 で取得した。
- Pagefind の記事フラグメントを最初の 1 回だけ abort する実ブラウザ回帰テストでは、エラー表示後の再試行が新しい Pagefind モジュールを読み込み、フラグメントを再取得して結果を表示した。検索・記事データ取得の失敗は世代単位でモジュールを無効化するため、古い並行検索の失敗が新しい世代を破棄しない。
- Shiki の生成する light / dark の前景色、背景色、文字装飾変数を CSS が消費することを実ブラウザで確認した。代表トークンは light の `rgb(0, 92, 197)` から dark の `rgb(121, 184, 255)` へ変わり、背景は白から `rgb(36, 41, 46)` へ変わった。斜体トークンも両テーマで維持された。確認画像は `.superpowers/sdd/2026-09-16-tanstack-start-migration/final-fixes-shiki-light.png` と `final-fixes-shiki-dark.png` に保存した。
- Wrangler の dry-run は生成設定から Worker モジュールと `dist/client` の 552 アセットを読み、アップロードせずに正常終了した。

## 記事本文と検索索引の一貫性

`src/content/posts/2026-03-14.mdx` の末尾に一時的な検証印を追加し、`pnpm build:start` で成果物を作った。
ブラウザーテストは、記事本文とその検証印による Pagefind 検索結果の両方を同じ preview から確認した。
検証後に記事を元へ戻し、Git 差分がないことを確認してから最終成果物を再構築した。

## 生成した Cloudflare 設定

`dist/server/wrangler.json` で次の値を確認した。

| 項目                        | 値                                                                      |
| --------------------------- | ----------------------------------------------------------------------- |
| Worker 名                   | `shusann-blog-start-preview`                                            |
| Worker entry                | `dist/server/wrangler.json` があるディレクトリからの相対パス `index.js` |
| 静的アセット                | `dist/server` からの相対パス `../client`                                |
| compatibility date          | `2026-09-15`                                                            |
| workers.dev                 | 有効                                                                    |
| version preview URL         | 有効                                                                    |
| route / custom domain       | 設定なし                                                                |
| `assets.not_found_handling` | `none`                                                                  |

静的アセットはデフォルトの優先順位で Worker より先に処理される。
存在しないアセットは `not_found_handling: none` によって Worker へ進み、Start が HTTP 404 を返す。

## 外部環境に残る確認

`pnpm exec wrangler whoami` は「認証されていない」と返した。
そのため、実際の deploy、プレビュー URL と deployment ID の取得、Cloudflare 上の preview に対する Playwright は実行していない。
このローカル preview 結果を Cloudflare プレビュー検証済みとは扱わない。

Google Analytics プロパティ側の「ブラウザーの履歴イベントに基づくページ変更」もアカウントから確認できていない。
本番切替前にこの設定を無効にし、手動の Router pageview との二重計測を避ける。

旧サービス種別、旧 deployment ID、本番ドメイン割当は Cloudflare アカウントを確認できず、未確認のままである。
公開 RSS の取得試行はツールの取得エラーで終わっており、本番の HTTP 状態を示す根拠にはならない。
