---
type: Engineering Rule
title: 実装と文書の管理ルール
---

# Issue と PR

作業計画、進捗、検証結果、残作業は GitHub Issue に記録する。
作業ごとに対応する Issue を用意し、実装 PR の本文から関連付ける。
Issue の完了条件を満たす PR は `Closes #番号`、一部の作業を扱う PR は `Refs #番号` で紐付ける。
計画や作業ログをリポジトリの Markdown ファイルとして残さない。

# 文書形式

`docs/` 配下の Markdown は [Open Knowledge Format](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md) に従う。
UTF-8 で保存し、先頭の YAML frontmatter に文書の種類を表す空でない文字列 `type` と、文書名を表す `title` を記載する。
文書間の参照には通常の Markdown リンクを使う。

# 意思決定

長期的な意思決定は `docs/adr/YYYY-MM-DD-{title}.md` に記録する。
[ADR テンプレート](adr/template.md) を使い、本文は「背景」と「決定」の 2 セクションに絞る。
背景には判断に必要な事情を簡潔に書き、決定には採用する方針を短文で書く。
実装手順や検証ログは ADR に含めず、対応する Issue と PR に記録する。
