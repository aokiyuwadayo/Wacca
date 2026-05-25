# YUWA

サークル運営のための、メンバーの「居場所」と「つながり」を支える Web アプリ。

> **YUWA**（ゆうわ）— 「結 (yui)」×「和 (wa)」= 結ばれた和。人と人を結ぶサークルの場。

---

## 🎯 はじめての人はここから読んでください

合流したエンジニア・運営メンバー向け：以下を **この順番で** 読むのがおすすめです。

1. 📘 **[事業計画書 (business-plan.md)](docs/business-plan.md)** — なぜ作るのか、誰のためか、ビジョン
2. 📋 **[要件定義 v0.1 (requirements-v0.1.md)](docs/requirements-v0.1.md)** — 何を作るのか、画面・データ・仕様
3. 📋 **[要件定義 v0.2 ドラフト (requirements-v0.2.md)](docs/requirements-v0.2.md)** — 出欠 / スケジュール / 名簿管理の追加機能
4. 📊 **[現状スナップショット (status-2026-05-25.md)](docs/status-2026-05-25.md)** — 今ここまで進んでいる
5. 🗺️ **[ロードマップ・進め方 (roadmap.md)](docs/roadmap.md)** — どう進めるか、体制、開発環境セットアップ

---

## 📂 その他のドキュメント

### 設計・分析
- 🎨 [ブランドビジュアル (brand-guidelines.md)](docs/brand-guidelines.md) — ロゴ・カラー・フォント・トーン
- 🗂️ [データモデル ER 図 (data-model-diagram.md)](docs/data-model-diagram.md) — 12 テーブルの関係を Mermaid で視覚化
- 🔍 [競合分析 (competitive-analysis.md)](docs/competitive-analysis.md) — Univ / Slack / Forms 等との比較・差別化

### 規約・法務
- ⚖ [利用規約 v1 ドラフト (legal/terms-of-service-v1-draft.md)](docs/legal/terms-of-service-v1-draft.md) — 法務レビュー前の暫定版

### 運営テンプレート
- 📨 [エンジニア招待文テンプレ (templates/engineer-invitation.md)](docs/templates/engineer-invitation.md) — エンジニアへの初回連絡用
- 👥 [モデレーター候補ヒアリングテンプレ (templates/moderator-recruitment.md)](docs/templates/moderator-recruitment.md) — モデレーター募集時の説明用
- 📣 [メンバー向けプレアナウンス (templates/member-pre-announcement.md)](docs/templates/member-pre-announcement.md) — ローンチ前後の告知文（部会・Slack・LINE）

---

## 概要

学生サークル運営に必要な機能を一括で提供し、メンバーが居心地よく集まり、意見を交わし、一緒に動ける場を作る Web アプリ。最初は福岡工業大学（FIT）起業部の公式ツールとして運用し、将来的に他大学サークルへの展開を見据える。

### コア機能（v0.1）

- 🗣️ **匿名意見箱** — 改善要望・アイデアを匿名で投稿（ハッシュ化匿名 + モデレーションキュー方式）
- 📅 **イベント掲示板** — 外部イベントの同行者募集
- 🛡️ **モデレーション** — 運営による公開前承認

### 拡張予定（v0.2 以降）

- 出欠管理
- スケジュール管理
- 本格的なメンバー名簿管理

## 現在のステータス

**Phase 0（準備）完了 → Phase 1（環境構築）着手前**

- ✅ 要件定義 v0.1 完了
- ✅ 要件定義 v0.2 ドラフト完了
- ✅ ブランド・リポ整備完了
- ✅ ハンドオフ用ドキュメント整備完了
- ✅ 利用規約 v1 ドラフト完了（レビュー待ち）
- ✅ エンジニア招待文・モデレーター招集テンプレ完成
- ⬜ コードはまだ書かれていない（リポは docs と README のみ）
- 🟡 部員エンジニア 1 名がボランティアで実装担当することが決定（2026-05-25）

詳細は [現状スナップショット](docs/status-2026-05-25.md) を参照。

## 推奨技術スタック

- フロントエンド: Next.js 15+ (App Router, TypeScript, Turbopack)
- スタイリング: Tailwind CSS + shadcn/ui
- バックエンド / DB / 認証: Supabase (PostgreSQL, Auth)
- ホスティング: Vercel
- パッケージマネージャ: pnpm
- ドメイン: yuwa.club（ローンチ近で取得予定）

詳細・選定理由は [roadmap.md §5](docs/roadmap.md) を参照。

## 体制

| 役割 | 担当 |
|---|---|
| プロダクトオーナー (PO) | 青木 |
| 開発エンジニア | 部員ボランティア 1 名（合流予定） |
| モデレーター | 運営チーム 3-4 名（ローンチ後アサイン） |

## ブランド

- **正式表記**: YUWA（全大文字）
- **読み**: ゆうわ
- **由来**: 「結 (yui)」+「和 (wa)」=「結ばれた和」
- **ドメイン**: yuwa.club（取得予定）

## ライセンス

未定（運営チーム内で検討）。
