# Cloudflare 本番切替と復旧手順

## 現在確認できる値

| 項目                               | 値                              | 状態                                  |
| ---------------------------------- | ------------------------------- | ------------------------------------- |
| 公開 origin                        | `https://blog.shusann01116.dev` | リポジトリの公開設定から確認済み      |
| 新 Worker 名                       | `shusann-blog-start-preview`    | 生成設定と dry-run で確認済み         |
| 新 Worker の route / custom domain | なし                            | ソースと生成設定で確認済み            |
| 承認済み Cloudflare account ID     | 未取得                          | プレビュー公開前に承認記録から取得    |
| プレビュー公開の承認記録           | 未記録                          | 承認者、操作者、対象と範囲を記録する  |
| 新 Worker の preview URL           | 未取得                          | Cloudflare 未認証のため未公開         |
| 新 deployment ID                   | 未取得                          | Cloudflare 未認証のため未公開         |
| 現在の配信サービス種別と名称       | 未確認                          | Cloudflare アカウントへの参照権限なし |
| 現在の deployment ID               | 未確認                          | Cloudflare アカウントへの参照権限なし |
| 現在の route / custom domain / DNS | 未確認                          | Cloudflare アカウントへの参照権限なし |
| GA の履歴変更による自動 pageview   | 未確認                          | GA プロパティへの参照権限なし         |

route と custom domain を持たず計測も無効なプレビューの公開には、承認済み account ID、公開権限、Worker 名の安全性を先に確認する。
旧本番の値と GA の設定はプレビュー公開を妨げないが、すべて埋めて切替と復旧で使う Cloudflare 操作を同じレビューに提示するまで、本番切替は未完了とする。

## プレビュー公開と比較

1. 公開責任者が、公開を承認する Cloudflare account ID、操作者、Worker 名 `shusann-blog-start-preview`、操作範囲が route と custom domain を持たないプレビュー公開だけであること、承認日時と参照先を上表へ記録する。
2. Cloudflare へ認証し、`pnpm exec wrangler whoami` の操作者と account ID が承認記録に完全一致することを確認する。一致しない場合は公開しない。
3. `CLOUDFLARE_ACCOUNT_ID=<approved-account-id> pnpm exec wrangler deployments list --name shusann-blog-start-preview --json` で対象アカウントに照会先を固定し、同名 Worker の有無を確認する。存在する場合は、承認記録と既存 deployment の来歴から今回のプレビュー Worker だと確認できた場合だけ更新する。無関係または判断不能なら公開せず、別名への設定変更をレビューする。
4. 計測を無効にしたデフォルト成果物を `pnpm build:start` で作る。
5. `CLOUDFLARE_ACCOUNT_ID=<approved-account-id> pnpm exec wrangler deploy --config dist/server/wrangler.json` で承認済みアカウントの `shusann-blog-start-preview` だけを公開する。この設定には route と custom domain がないため、本番 origin は切り替わらない。
6. 公開時の preview URL と deployment ID を記録し、`CLOUDFLARE_ACCOUNT_ID=<approved-account-id> pnpm exec wrangler deployments list --name shusann-blog-start-preview --json` と照合する。
7. `TEST_ORIGIN=<preview-url> pnpm exec playwright test --reporter=line` を実行し、ローカル preview と同じテストを通す。
8. Cloudflare プレビューから、`/_pagefind/pagefind.js`、分割索引、記事フラグメント、画像、フォント、RSS、404、308 を取得した証跡を `verification.md` へ追記する。

## 本番切替

1. プレビュー比較の完了後、Cloudflare の設定画面または API で、現在の配信サービス種別、サービス名、deployment ID、`blog.shusann01116.dev` の route、custom domain、DNS レコードの実値を上表に記録する。
2. GA プロパティで履歴変更による自動 pageview が無効であることを確認する。
3. 公開 origin だけで有効になる `VITE_ENABLE_ANALYTICS=true pnpm build:start` で本番成果物を作る。
4. `CLOUDFLARE_ACCOUNT_ID=<approved-account-id> pnpm exec wrangler deploy --config dist/server/wrangler.json` で本番成果物を公開し、新しい deployment ID を記録する。
5. 取得した現行設定に合わせて、`blog.shusann01116.dev` の custom domain または route を `shusann-blog-start-preview` へ付け替える。DNS 方式であれば、記録した旧レコードと TTL を保存したうえで新しい配信先へ更新する。
6. 本番 origin に全 Playwright を実行し、トップ、記事一覧、6 記事、2 タグ、RSS、検索、404、308、画像とフォントを確認する。
7. GA のリアルタイム表示または DebugView で、初期表示と SPA 遷移がそれぞれ 1 回だけ pageview を送ることを確認する。
8. 確認結果と切替時刻を記録してから、タスク 9 で Next.js を除去する。

Cloudflare 上の現行設定を取得するまで、付け替えの実コマンドや API ペイロードは確定できない。
未確認のサービス種別を Workers または Pages と仮定してコマンドを作らず、取得した設定に合う操作を本番承認前に追記する。

## 復旧

次のどれかが発生した場合は、Next.js の除去を始めずに復旧する。

- 主要ページが 5xx を返す。
- 記事本文、RSS、Pagefind 索引、画像、フォントのいずれかを取得できない。
- 404 または 308 の公開契約が変わる。
- pageview が二重に計測される。

復旧手順は次のとおりである。

1. 記録した旧 route または custom domain の割当を旧サービスへ戻す。DNS を変更した場合は、保存した旧レコードを同じ TTL で復元する。
2. 旧 Worker を同名の新バージョンで更新する方式だった場合だけ、`pnpm exec wrangler rollback <old-version-id> --name <old-worker-name>` を使う。今回のように Worker 名が別であれば、ドメイン割当の復元を行う。
3. `https://blog.shusann01116.dev` に契約テストを実行し、旧 deployment ID が再び配信されていることを Cloudflare の設定と HTTP 応答の両方で確認する。
4. 発生条件、切替時刻、復旧時刻、対象 deployment ID を記録する。

Next.js のソース、依存関係、起動コマンドは、本番検証と復旧可能性を確認するまで保持する。
