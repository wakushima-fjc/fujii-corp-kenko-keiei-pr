# 株式会社フジイコーポレーション 健康経営支援 自動SEOコンテンツサイト

島根県内の事業所様向けに、健康経営支援(ストレスチェックの実施者代行/外部委託)をテーマにしたSEOコラムを、
**GitHub Actions + GitHub Pagesのみ(追加コスト0円)** で毎週自動生成・自動公開する仕組みです。
外部のLLM APIやSaaSは使用していません。

## 仕組みの全体像

```
毎週月曜 06:00 JST (GitHub Actions cron)
  → node scripts/generate.mjs   … 市町村×業種×切り口の組み合わせから1記事を機械的に生成
  → node scripts/build.mjs      … public/ 配下に静的サイト(HTML/sitemap/RSS)を再構築
  → git commit & push           … 生成結果をリポジトリに記録
  → GitHub Pagesへ自動デプロイ  … actions/deploy-pages
  → IndexNowへ通知              … Bing/Yandex等に即時インデックス依頼(無料)
```

- **コンテンツ生成は完全にテンプレート駆動**で、外部APIキー・課金は一切不要です。
- 「島根県 8市」×「業種 8種」×「切り口 8パターン」= 512通りの組み合わせを順番に消化していくため、
  約9.8年分(週1本ペース)ネタが尽きません。
- 生成される文章は `scripts/lib/content.mjs` 内の `BANNED_WORDS` チェックを必ず通過します。
  「唯一」「日本一」「業界No.1」など、根拠なく排他的・誇大に読める表現が万一紛れ込んだ場合は
  ビルド自体が失敗し、公開されません。

## 公開前に必ずやること(TODO)

1. **`data/company.json` の内容を事実確認のうえ書き換える**
   - `websiteUrl` / `contactUrl`: 実際の自社サイト・問い合わせページのURLに変更
   - `siteUrl`: GitHub Pagesの実URL(組織名/リポジトリ名を作成後に確定)に変更
   - `servicesSummary` / `positioning`: 実際に提供しているサービス内容と齟齬がないか確認
2. **GitHub Pagesを有効化する(初回のみ・手動)**
   - リポジトリの Settings → Pages → Source を **「GitHub Actions」** に設定
   - これを行わないと `actions/deploy-pages` がデプロイ先を見つけられません
3. **ワークフローを一度手動実行して動作確認する**
   - Actions タブ → `Generate & Publish` → `Run workflow`
4. **記事内容を一度は人の目でレビューする**
   - 自動生成とはいえ、公開される文章です。特に固有の制度説明部分(面接指導の要否など)は
     厚生労働省の最新情報と齟齬がないか、担当者が確認してから公開することを推奨します。

## コンプライアンス上の注意

- 本仕組みは「唯一」「県内初」等の**排他的・独占的な表現は使わない**方針で設計されています
  (景品表示法の優良誤認表示リスクを避けるため)。表現を変更する場合も、根拠のない優越性の主張は避けてください。
- `data/company.json` の `disclaimer` は全ページのフッターに自動挿入されます。内容を薄めないでください。
- 実在しない実績・認定・件数などを `data/topics.json` や `scripts/lib/content.mjs` に追加しないでください。

## ローカルでの動作確認

```bash
node scripts/generate.mjs   # 記事を1本生成 (content/articles.json, data/state.json を更新)
node scripts/build.mjs      # public/ に静的サイトを再構築
python3 -m http.server 8000 --directory public   # ローカルプレビュー
```

## ディレクトリ構成

```
data/company.json     … 会社情報(公開前に要編集)
data/topics.json       … 市町村・業種・切り口の組み合わせプール
data/state.json         … 次に生成する組み合わせの進行状況(自動更新)
data/indexnow-key.txt   … IndexNow用の検証キー
content/articles.json  … 生成済み記事の本文データ(自動更新・追記のみ)
scripts/generate.mjs    … 記事を1本生成するスクリプト
scripts/build.mjs        … content/articles.json から public/ の静的サイトを再構築
scripts/lib/content.mjs  … 切り口ごとの文章テンプレートとコンプライアンスチェック
scripts/lib/render.mjs   … 共通HTMLレイアウト
assets/style.css         … サイト共通スタイル
public/                  … ビルド後の静的サイト(GitHub Pagesの公開対象)
.github/workflows/publish.yml … 週次の自動生成・ビルド・デプロイ・IndexNow通知
```

## 配信範囲を広げたくなったら

現状は「自社サイトのブログ/SEOページへの自動投稿」のみを無料枠で実装しています。
将来的に以下を追加したい場合は、別途ご相談ください(いずれも無料枠を超える可能性、または手動作業が発生します)。

- プレスリリース配信サービス(PR TIMES等): 多くのサービスで**投稿自体は手動承認が必要**なため、
  完全自動化は難しく、下書き自動生成 + 手動投稿の組み合わせが現実的です。
- SNS(X等)への自動投稿: API利用に無料枠の制限や申請が必要です。
- Google ビジネスプロフィールへの自動投稿: API利用申請が必要です。
