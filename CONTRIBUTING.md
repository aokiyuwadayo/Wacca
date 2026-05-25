# Contributing to YUWA

YUWA の開発に参加してくださりありがとうございます 🙏

このドキュメントは、コードを書く方（主に部員ボランティアエンジニア）に向けた開発フローのガイドです。

---

## 0. はじめに読むもの

このドキュメントの前に、まず以下を読んでください:

1. [README](README.md) — プロジェクトの全体像
2. [docs/business-plan.md](docs/business-plan.md) — なぜ作るのか
3. [docs/requirements-v0.1.md](docs/requirements-v0.1.md) — 何を作るのか
4. [docs/roadmap.md](docs/roadmap.md) — どう進めるか（**特に「体制と役割」「コミュニケーション」**）

---

## 1. 開発フロー（基本）

```
Issue 確認  →  ブランチ作成  →  実装  →  PR 作成  →  レビュー (or セルフマージ)  →  main マージ
```

### 1.1 Issue から始める
- すべての変更は GitHub Issue に紐づくのが理想
- Issue がない軽微な修正（typo 等）は PR だけでも OK
- Issue を見つけたら、自分でアサインする（コメントで「これやります」でも OK）

### 1.2 ブランチを切る
```bash
git checkout -b <type>/<short-description>
```

ブランチ名の慣習（例）:
- `feat/invite-code-signup` — 新機能
- `fix/login-redirect-loop` — バグ修正
- `chore/upgrade-next` — メンテナンス
- `docs/update-readme` — ドキュメント
- `refactor/auth-hooks` — リファクタリング

### 1.3 実装する
- 詰まったら抱え込まず、PO（青木）か他のメンバーに相談してください
- 「PR で見せたほうが早い」と感じたら、Draft PR を早めに作る選択肢もあり

### 1.4 コミット規約

**Conventional Commits 推奨**（厳格には強制しません）

```
<type>(<scope>): <短い説明>

<本文（任意）>
```

`type` の例:
- `feat` — 新機能
- `fix` — バグ修正
- `chore` — メンテナンス・設定変更
- `refactor` — リファクタリング（機能変更なし）
- `docs` — ドキュメント
- `style` — フォーマット（コード意味変えない）
- `test` — テスト追加・修正
- `perf` — パフォーマンス改善

良い例:
```
feat(auth): 招待コード経由のサインアップフロー実装

- /join?code= ページ追加
- Google OAuth 経由で auth.users 作成
- members レコードと anonymous_hash を生成
```

### 1.5 PR を作る
- [PR テンプレート](.github/PULL_REQUEST_TEMPLATE.md) に沿って書く
- スクリーンショット（UI 変更時）は積極的に
- 関連 Issue を「Closes #N」で結ぶと自動クローズされる

### 1.6 レビュー

**基本方針**: ボランティア前提なので過度なレビュー負担はかけない。

- **PO の青木がレビュー** — 非エンジニア視点で UI/UX、要件適合性、規約抵触の有無を見ます
- **技術細かいレビューは無理に求めない** — 自身のベストプラクティスに任せます
- **以下は事前に PO 相談してください**:
  - DB スキーマ変更
  - 認証フローの変更
  - 規約・個人情報の扱いに関わる変更
  - 大きな依存追加（Stripe、外部 API 連携など）

### 1.7 マージ

- **セルフマージ可** — 軽微な変更や急ぎの修正は自分でマージして OK
- マージ方法: **Squash merge** 推奨（履歴がきれいに保たれる）
- ブランチは削除（GitHub UI で自動削除設定推奨）

### 1.8 main の状態

- main は常に動く状態を維持
- 壊れたまま放置しない → 修正 PR を急ぐ

---

## 2. 技術スタック

詳細は [docs/roadmap.md §5](docs/roadmap.md) を参照。

要約:
- Next.js 15+ (App Router, TypeScript, Turbopack)
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL, Auth)
- Vercel (Hobby plan)
- pnpm

---

## 3. ローカル開発のセットアップ

> Next.js プロジェクトはまだ初期化されていません。最初に着手する方は [Phase 1 の Day 1 Issue](https://github.com/aokiyuwadayo/yuwa/issues) を参照してください。

### 前提
- Node.js 20 以上（推奨 v24 系）
- pnpm 11+
- Git
- GitHub アカウント
- Docker Desktop（ローカル Supabase を使う場合）
- Supabase CLI（ローカル Supabase を使う場合）

### 初期化後の標準フロー（Phase 1 完了後）
```bash
git clone https://github.com/aokiyuwadayo/yuwa.git
cd yuwa
pnpm install

# リモート Supabase の接続情報が未共有の場合はローカルで起動
supabase start

cp .env.example .env.local
# `supabase status` の API URL / anon key / service_role key を .env.local に転記

pnpm dev
```

### 環境変数

`.env.local` に必要な変数。リモート Supabase を使う場合は PO に共有依頼し、ローカル Supabase を使う場合は `supabase status` から取得してください。

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — サーバーサイドのみ
- `ANONYMOUS_HASH_SALT` — 匿名ハッシュ用の固定 salt
- `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET`

ローカル Supabase Studio は標準設定では `http://127.0.0.1:54323` で開けます。

---

## 4. ディレクトリ構成（想定）

Next.js 初期化後の標準構成:

```
yuwa/
├── src/
│   ├── app/                  # App Router のページ
│   │   ├── (auth)/           # 認証関連
│   │   ├── (member)/         # メンバー向け画面
│   │   ├── (admin)/          # 運営向け画面（モデキュー等）
│   │   └── api/              # Route Handlers
│   ├── components/           # 再利用可能な UI コンポーネント
│   │   ├── ui/               # shadcn/ui の生成物
│   │   └── ...               # アプリ固有
│   ├── lib/
│   │   ├── supabase/         # Supabase クライアント
│   │   ├── auth/             # 認証ヘルパー
│   │   └── ...
│   └── styles/
├── supabase/
│   ├── migrations/           # DB migration
│   └── seed.sql              # 初期データ（開発用）
├── public/                   # 静的アセット
└── docs/                     # （既存）
```

詳細はエンジニア合流後に調整。

---

## 5. 質問・困った時

- **仕様の疑問**: PO（青木）に Slack/LINE で気軽に
- **技術判断**: 自分の判断で進めて OK。詰まったら相談
- **PR レビュー待ち**: 24-48 時間で返事します。急ぎなら声かけてください
- **本気で詰まった**: 一緒に画面共有して考えましょう

---

## 6. コードレビューでよく見るポイント（PO 視点）

レビュー時に主に見るもの:

- [ ] **UI/UX**: モック・ブランドガイドに沿っているか
- [ ] **要件適合**: 機能要件を満たしているか
- [ ] **規約適合**: 匿名性・個人情報の扱いが規約に沿っているか
- [ ] **エラーハンドリング**: ユーザー視点で「動かない時」の表示が分かりやすいか
- [ ] **アクセシビリティ**: コントラスト・キーボード操作・スクリーンリーダー対応

技術的なコードレビュー観点（性能・テスト網羅性・設計パターン等）は基本的に開発者の裁量に委ねます。

---

## 7. 関連ドキュメント

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [ロードマップ](docs/roadmap.md)
- [ブランドガイドライン](docs/brand-guidelines.md)
- [データモデル ER 図](docs/data-model-diagram.md)
