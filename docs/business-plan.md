# YUWA 事業計画書

> **対象読者**: 青木、引き継ぎ先 PO、運営チーム、開発エンジニア
> **目的**: YUWA の事業・プロダクト・開発状況を一枚で引き継げる状態にする
> **更新日**: 2026-05-27
> **作成者**: 青木 / Codex
> **ステータス**: MVP 開発中。Phase 1 は一部完了、Phase 2 の DB 基盤を先行実装中

---

## 1. エグゼクティブサマリー

YUWA は、学生サークルの「居場所」と「つながり」を支える Web アプリです。最初の導入先は福岡工業大学（FIT）起業部で、MVP では匿名意見箱、モデレーションキュー、イベント掲示板、招待コード付き認証を提供します。

現時点では収益化よりも、起業部内で安全に使える公式ツールとして成立させることを優先します。成功条件は、部員が安心して意見を出せること、運営が過度な負担なくモデレーションできること、イベント参加の心理的ハードルが下がることです。

2026-05-27 時点で、Next.js / Tailwind / shadcn/ui / Supabase の基盤、ローカル Supabase 設定、基本 DB migration は main に入っています。匿名意見箱関連の DB migration は PR #21 としてレビュー待ちです。Google OAuth、Vercel preview、本番 Supabase 接続情報は PO 側のアカウント作業待ちです。

---

## 2. 背景と課題

学生サークルの運営は、多くの場合 Slack、LINE、Google Forms、スプレッドシートを組み合わせて行われています。これらは個別の用途には便利ですが、サークル運営の本質的な課題である「心理的安全性」「参加しやすさ」「運営の継続性」を一体で支えるには不足があります。

FIT 起業部で顕在化している課題は次の通りです。

| 課題 | 現状の問題 | YUWA の対応 |
|---|---|---|
| 言いづらい意見が運営に届かない | Slack / LINE では名前が出るため本音を書きにくい | ハッシュ化匿名の意見箱 |
| 匿名投稿の治安維持が難しい | 完全匿名フォームでは荒れた時に継続対処できない | anonymous_hash と BAN、公開前モデレーション |
| イベントに一人で行きづらい | 誰が行くかわからず、参加機会を逃す | イベント掲示板と参加表明 |
| 情報が流れて蓄積しない | Slack に投稿が埋もれ、振り返りにくい | 投稿・イベントの一覧化 |
| 運営判断が属人化する | 承認・却下の履歴が残らない | moderation_actions による監査ログ |

---

## 3. ビジョンとミッション

### ビジョン

学生サークルに「安心して言える場」と「一緒に動けるきっかけ」を提供し、メンバーが自分の居場所を実感できる状態を作る。

### ミッション

サークルメンバーの「言いたいことを安全に言える」「気軽に集まれる」「運営を無理なく続けられる」を支える Web アプリを提供する。

### プロダクト原則

- 匿名性は機能ではなく信頼の土台として扱う
- 運営が一人で抱え込まない仕組みにする
- MVP は FIT 起業部で実際に使える範囲に絞る
- 他大学展開を見据え、organization を first-class entity として扱う
- ボランティア開発のため、実装範囲を小さく切る

---

## 4. ターゲットユーザー

### MVP

FIT 起業部の現役メンバー約 40 名と、運営チーム 3-4 名。

### 将来の展開先

最初の横展開候補は、他大学の起業系・スタートアップ系サークルです。文化や活動内容が近く、匿名意見箱とイベント同行ニーズが比較的共通しているためです。

その後、部活・同好会・学生団体一般へ広げる余地があります。ただし、一般サークル管理 SaaS との競合が強くなるため、PMF 後に判断します。

---

## 5. MVP スコープ

### v0.1 で作るもの

| 機能 | 内容 | 事業上の意味 |
|---|---|---|
| 招待コード認証 | 招待 URL から Google OAuth で参加 | 部外者の流入を防ぐ |
| 匿名意見箱 | 匿名 / 記名で意見投稿 | 心理的安全性を作る |
| モデレーションキュー | 投稿の承認、却下、BAN | 匿名性と治安維持を両立する |
| リアクション | 投稿への共感表明 | 意見の重要度を可視化する |
| イベント掲示板 | 外部イベントの同行者募集 | メンバー間の接点を増やす |
| 最小メンバー管理 | display_name / role / status | 認可と運用管理の基礎 |

### v0.1 では作らないもの

- DM / チャット
- プッシュ通知
- カレンダー連携
- ファイルアップロード
- OB 専用機能
- 他大学切り替え UI
- 検索機能
- 投稿への返信スレッド

### v0.2 以降の候補

- 出欠管理
- スケジュール管理
- 名簿管理
- roster_changes による変更履歴
- ICS エクスポート
- メール / Slack 通知

---

## 6. 差別化

| 既存手段 | 不足 | YUWA の差別化 |
|---|---|---|
| Slack / LINE | 匿名性がなく、情報が流れる | 匿名意見を蓄積し、モデレーションできる |
| Google Forms | 投稿後の一覧・共感・運用が弱い | 意見一覧、リアクション、承認フローを持つ |
| Discord | サークル運営の公式記録に向きにくい | 運営ワークフローに特化 |
| 既存サークル管理 SaaS | 機能過多、心理的安全性への特化が弱い | 匿名意見箱と居場所感を中心に設計 |

最大の差別化は、単なる匿名投稿ではなく、`anonymous_hash` とモデレーションを組み合わせて「投稿者を通常運用では見せないが、同一ハッシュの継続違反には対応できる」点です。

---

## 7. 技術構成

| 領域 | 採用技術 | 状態 |
|---|---|---|
| フロントエンド | Next.js 16 App Router / TypeScript | 実装済み |
| スタイリング | Tailwind CSS 4 | 実装済み |
| UI | shadcn/ui | 実装済み |
| DB / Auth | Supabase | ローカル設定済み、リモート未作成 |
| SSR Auth | @supabase/ssr | proxy.ts で session refresh 実装済み |
| Hosting | Vercel | 未着手 |
| Package manager | pnpm 11 | 実装済み |

Next.js 16 では `middleware.ts` が deprecated のため、Supabase session refresh は `src/proxy.ts` から `src/lib/supabase/middleware.ts` を呼ぶ構成にしています。

Supabase は PO からリモート接続情報を受け取るまで、ローカル Docker の Supabase CLI を使う方針です。ただし現作業環境では Docker daemon が起動しておらず、`supabase db reset` は未検証です。

---

## 8. データと匿名性の設計

### 基本方針

匿名投稿の投稿者 ID は DB には保存しますが、通常の authenticated API では `posts.author_member_id` を SELECT できないようにします。運営向け UI でも投稿者 ID は表示せず、必要な場合は `author_hash` の先頭 4 文字だけを表示します。

### 実装済みの防御

- `organizations.anonymity_salt` は authenticated SELECT grant から除外
- `members.anonymous_hash` は authenticated SELECT grant から除外
- `generate_member_anonymous_hash()` は `service_role` のみ実行可能
- TypeScript 側の hash 生成 helper は削除し、DB 関数に一本化
- `posts.author_member_id` と `posts.author_hash` は PR #21 で authenticated SELECT grant から除外
- moderator queue は PR #21 の `list_moderation_posts()` で `author_hash_prefix` のみ返す
- `banned_hashes.hash` も PR #21 で authenticated SELECT grant から除外

### 重要な運用ルール

通常運用では、運営も投稿者を特定しません。重大な規約違反があった場合のみ、複数人の合意と監査ログを前提に `service_role` で調査する方針です。この方針は利用規約 v1 ドラフトにも反映されています。

---

## 9. 現在の開発状況

### main に入っているもの

| Issue / PR | 状態 | 内容 |
|---|---|---|
| #7 / #18 | 完了 | Next.js 16、Tailwind 4、shadcn/ui、Supabase client 雛形、匿名 hash 表示 helper |
| #8 / #19 | 完了 | Supabase local config、session refresh proxy、環境変数手順 |
| #10 / #18 | 完了 | shadcn/ui 初期化とブランド UI 基盤 |
| #12 / #20 | 完了 | organizations、invite_codes、members、RLS、seed |

### レビュー待ち

| PR | 状態 | 内容 |
|---|---|---|
| #21 | OPEN / MERGEABLE | posts、post_reactions、moderation_actions、banned_hashes、匿名性の column grant / RLS |

### 未着手・ブロッカー

| Issue | 状態 | ブロッカー / 備考 |
|---|---|---|
| #9 | OPEN | Google Cloud Console と Supabase Auth Provider の PO 作業が必要 |
| #11 | OPEN | Vercel アカウント / GitHub 連携が必要 |
| #13 | OPEN | #9 が必要。Mock で一部先行は可能 |
| #15 | OPEN | #14 merge 後に着手可能 |
| #16 | OPEN | DB / UI として self-contained に着手可能 |

---

## 10. ロードマップ

### 直近の推奨順

1. PR #21 をレビュー、必要修正後に merge
2. Docker Desktop を起動できる環境で `supabase db reset` を実行
3. #9 Google OAuth の PO 作業を完了
4. #11 Vercel preview を構築
5. #13 招待コードから members 作成までの認証フローを実装
6. #15 匿名意見投稿フォームとモデレーションキューを実装
7. #16 events / event_participants とイベント掲示板を実装

### MVP ローンチまでのフェーズ

| フェーズ | 内容 | 完了条件 |
|---|---|---|
| Phase 1 | 開発・デプロイ基盤 | Next.js、Supabase、Vercel、Google OAuth が通る |
| Phase 2 | コア機能 | 認証、意見箱、モデキュー、イベント掲示板が動く |
| Phase 3 | 内部ドッグフード | 運営 3-4 名が実際に使い、重大バグを潰す |
| Phase 4 | ローンチ | 利用規約レビュー、招待コード配布、使い方説明 |
| Phase 5 | v0.2 | 出欠、スケジュール、名簿管理 |

---

## 11. KPI

### ローンチ後 2 週間

- FIT 起業部メンバーの 50% 以上がサインアップ
- 意見投稿 5 件以上
- イベント投稿 2 件以上
- モデレーション滞留 48 時間超が 10% 未満

### 3 ヶ月後

- 月次アクティブメンバー 15 名以上
- 意見投稿またはイベント投稿が月 5 件以上
- YUWA で出た意見が部の運営改善につながった事例 1 件以上

### 半年後

- v0.2 の出欠 / スケジュール / 名簿のいずれかを運用開始
- 他大学サークル 1 団体以上から試験利用の相談

---

## 12. 収益・費用方針

現時点では収益化しません。MVP は FIT 起業部向けの無料運用とし、Vercel / Supabase の無料枠または低額課金で成立させます。

想定費用:

| 項目 | 想定 |
|---|---|
| Supabase | Hobby / Free から開始 |
| Vercel | Hobby / Free から開始 |
| ドメイン | `yuwa.club` 年 1,500-2,500 円程度 |
| 法務レビュー | 可能なら OB / 知人に相談。外部依頼は必要性に応じて判断 |

将来的に他大学展開する場合は、学校単位またはサークル単位の低額サブスクリプションを検討します。ただし、学生団体向けのため、収益性より継続可能な運用費回収を優先します。

---

## 13. 体制と引き継ぎ

| 役割 | 担当 | 引き継ぎ事項 |
|---|---|---|
| PO | 青木 | 要件判断、運営調整、アカウント作成、レビュー |
| 開発 | Codex / 部員エンジニア | 実装、PR 作成、技術判断 |
| モデレーター | 運営チーム 3-4 名 | 投稿承認、却下、BAN、運用ルール |
| 後任 PO | 未定 | ローンチ後の改善判断、権限管理 |

### 引き継ぎ時に必ず渡すもの

- GitHub repository 権限
- Supabase project 権限
- Vercel project 権限
- Google Cloud OAuth client 権限
- `ANONYMOUS_HASH_SALT` と Supabase service role key の保管場所
- ドメイン管理アカウント
- 利用規約とモデレーション基準

シークレットは GitHub に絶対に置かず、1Password / Bitwarden / Signal / Vercel 直接入力のいずれかで管理します。

---

## 14. リスクと対策

| リスク | 影響 | 対策 |
|---|---|---|
| 匿名性の設計ミス | 信頼失墜 | column grant、RLS、service_role 限定 RPC、レビュー徹底 |
| Google OAuth / Vercel / Supabase の PO 作業遅れ | 認証・デプロイが止まる | setup-checklist.md に沿って先に進める |
| Docker 未起動で migration 未検証 | SQL 適用時に不具合発覚 | Docker Desktop 起動環境で `supabase db reset` を早期実行 |
| ボランティア開発の停滞 | スケジュール遅延 | スコープ削減、PR 単位を小さくする |
| モデレーション運用負荷 | 投稿滞留、信頼低下 | 運営 3-4 名体制、48 時間 SLA |
| 利用規約の未レビュー | 法務・運用リスク | ローンチ前に運営チームと可能なら法務経験者が確認 |
| 青木卒業後の継承 | 運用停止 | 権限、シークレット、ドキュメント、後任 PO を明文化 |

---

## 15. 次にやること

### PO 側

- Supabase production project を Tokyo region で作成
- Google Cloud OAuth client を作成し、Supabase Auth Provider に設定
- Vercel アカウント / GitHub 連携を準備
- `ANONYMOUS_HASH_SALT` を生成し、パスワードマネージャに保存
- モデレーター候補 3-4 名に事前説明
- 利用規約 v1 ドラフトを運営チームでレビュー

### 開発側

- PR #21 をレビュー・merge
- Docker Desktop 起動後に `supabase db reset`
- #13 認証フローを実装
- #15 意見投稿フォームとモデキューを実装
- #16 イベント掲示板を実装
- Vercel preview で PO が確認できる状態にする

---

## 16. 関連資料

- [README](../README.md)
- [要件定義 v0.1](requirements-v0.1.md)
- [要件定義 v0.2 ドラフト](requirements-v0.2.md)
- [ロードマップ](roadmap.md)
- [現状スナップショット](status-2026-05-25.md)
- [PO セットアップチェックリスト](setup-checklist.md)
- [データモデル ER 図](data-model-diagram.md)
- [競合分析](competitive-analysis.md)
- [利用規約 v1 ドラフト](legal/terms-of-service-v1-draft.md)
- GitHub repository: https://github.com/aokiyuwadayo/yuwa
- PR #21: https://github.com/aokiyuwadayo/yuwa/pull/21
