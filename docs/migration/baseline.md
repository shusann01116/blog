# 現行ブログの比較基準

Next.js 版の本番ビルドを Node.js 24.21.0 で起動し、公開レスポンスを比較基準として保存する。

```sh
TZ=UTC pnpm build
TZ=UTC pnpm exec next start -p 3100
pnpm exec tsx scripts/migration/capture-baseline.ts \
  --origin http://localhost:3100 \
  --output tests/fixtures/migration/baseline.json
TEST_ORIGIN=http://localhost:3100 \
  pnpm exec playwright test tests/e2e/contracts.spec.ts
```

`capture-baseline.ts` は `/`、記事一覧、全記事、タグページ、不明パス、RSS、静的ファイルを取得する。HTML ページでは末尾スラッシュと `?q=test` も別のリクエストとして記録する。各レスポンスの status、Location、title、description、canonical、Open Graph、見出し ID と、記事の公開メタデータ、RSS 本文を保存する。

## 公開設定

| 項目                       | 確認結果                        | 根拠                                       |
| -------------------------- | ------------------------------- | ------------------------------------------ |
| 設定上の公開 origin        | `https://blog.shusann01116.dev` | `CLAUDE.md` と RSS の `siteUrl`            |
| 実際のカスタムドメイン割当 | 未確認                          | Cloudflare アカウントを確認していない      |
| 旧サービス名               | 未確認                          | リポジトリにデプロイ設定やサービス名がない |
| 旧デプロイ識別子           | 未確認                          | リポジトリにデプロイ ID がない             |

Cloudflare アカウント上のプロジェクト、カスタムドメイン割当、直近のデプロイ識別子は、この作業では確認していない。推測で補わず、本番切替前にアカウントの設定画面または API から取得して照合する。

## 日付と RSS

RSS は実行環境のタイムゾーンに依存する。`TZ` を指定しない macOS の JST 環境では、スラッシュ区切りの frontmatter 日付が前日の `15:00:00 GMT` になり、ハイフン区切りの日付は当日の `00:00:00 GMT` になった。この差はコンテンツの意図ではなく `new Date(...)` の入力形式と実行環境によるため、RSS の基準値は `TZ=UTC` で取得し、すべて名目上の公開日の `00:00:00 GMT` とした。

記事 HTML の `time[datetime]` はビルド時に生成された現行値をそのまま記録している。frontmatter の日付を `YYYY-MM-DD` に統一する作業は後続タスクで行い、名目上の公開日は変えない。

公開 origin の DNS 名前解決を試したが、この作業環境では失敗したため、本番 RSS の実測値は確認できていない。デプロイ前のゲートとして、本番または同じタイムゾーン設定のプレビューで RSS の公開日を照合する。
