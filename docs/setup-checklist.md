# PO アカウント作成・支払い系チェックリスト

> **対象**: 青木（PO）
> **目的**: エンジニアが Issue #8 / #9 / #11 等に着手する時に「アカウント未作成でブロック」を避けるため、PO 側で先に作っておく作業の手順を可視化
> **想定タイミング**: エンジニア合流前 or 並行
> **想定所要時間**: 合計 60-90 分（待ち時間含む）

---

## 0. 概要 — PO が手を動かす作業

YUWA 実装には、コード以外に以下のアカウント・支払いが必要です。これらはエンジニアが代行できない（個人情報・支払い情報の問題）ため、PO の青木が進めます。

| # | 項目 | コスト | 所要時間 | エンジニアブロック対象 |
|---|---|---|---|---|
| 1 | Supabase アカウント + プロジェクト | 無料（Hobby） | 15 分 | Issue #8, #12, #14 |
| 2 | Google Cloud Console + OAuth クライアント | 無料 | 30 分 | Issue #9 |
| 3 | Vercel アカウント + GitHub 連携 | 無料（Hobby） | 10 分 | Issue #11 |
| 4 | ドメイン yuwa.club 取得 | 年 1,500〜2,500 円 | 15 分 | （ローンチ近で OK） |
| 5 | シークレットの安全な共有 | — | 10 分 | 上記全て |

**チェックリストを上から順に進めれば OK**。各項目に詳細手順あり。

---

## 1. Supabase アカウント + プロジェクト作成

> **エンジニア向け暫定方針**: PO からリモート接続情報を受け取るまでは、Supabase CLI のローカル環境で開発を進める。`supabase start` 後、`supabase status` に表示される API URL / anon key / service_role key を `.env.local` に設定する。

### 1.1 アカウント作成

- [ ] https://supabase.com にアクセス
- [ ] **Sign up with GitHub**（青木さんの GitHub アカウント `aokiyuwadayo` で）
- [ ] 組織名: 個人で良いなら自動で「Yuwa's Org」のような名前。後で `yuwa` に rename 可
- [ ] メール確認

### 1.2 プロジェクト作成

- [ ] **New Project** ボタン
- [ ] Project name: `yuwa-production`（あるいは `yuwa-mvp`）
- [ ] **Database Password**: 強力なものを生成 → **必ず控える**（後で再表示されない）
  - 推奨: 1Password / Bitwarden 等のパスワードマネージャに保存
- [ ] **Region: Northeast Asia (Tokyo)**（東京リージョン）← 重要
- [ ] **Pricing Plan: Free**（後で必要なら Pro に上げる）
- [ ] **Create new project** → 2-3 分待つ

### 1.3 接続情報の取得

プロジェクトが起動したら:

- [ ] 左メニュー **Settings** → **Data API**
  - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
  - **anon public key**: 公開しても OK な API キー
  - **service_role secret key**: ⚠ サーバーサイドのみで使う、絶対公開しない
- [ ] これら 3 つを **§5 シークレット共有** の手順でエンジニアに共有

### 1.4 開発環境（dev）プロジェクトも作るか？（任意）

本番と開発を分けたい場合:
- [ ] 同じ手順で `yuwa-development` を別プロジェクトとして作成
- [ ] **ただし無料枠は 2 プロジェクトまで**。MVP では本番 1 つで進めて、必要になったら追加でも OK

### 1.5 ローカル Supabase（エンジニア用）

リモート Supabase の接続情報が未共有でも、以下で Issue #12 以降の DB / Auth 実装に着手できます。

```bash
pnpm install
supabase start
supabase status
```

`supabase status` の値を `.env.local` に転記:

- `API URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`

ローカル Supabase Studio:

- `http://127.0.0.1:54323`

停止する場合:

```bash
supabase stop
```

---

## 2. Google Cloud Console + OAuth クライアント作成

### 2.1 Google Cloud プロジェクト作成

- [ ] https://console.cloud.google.com/ にアクセス（青木さんの Google アカウントで）
- [ ] 上部のプロジェクト選択 → **新しいプロジェクト**
- [ ] プロジェクト名: `YUWA`
- [ ] 組織: なし（個人）
- [ ] 作成

### 2.2 OAuth 同意画面の設定

- [ ] 左メニュー **APIs & Services** → **OAuth consent screen**
- [ ] **External**（ユーザータイプ）を選択 → 作成
- [ ] **App information**:
  - App name: `YUWA`
  - User support email: 青木さんのメール
  - App logo: 後で `docs/brand/icon-512.svg` から PNG 化して設定（任意）
- [ ] **App domain** はローンチ前で OK、または `yuwa.club` を仮入力
- [ ] **Developer contact information**: 青木さんのメール
- [ ] **保存して次へ**
- [ ] **Scopes**: デフォルト（email, profile, openid）のまま
- [ ] **Test users**: 青木さん自身と部員エンジニアのメールを追加（公開前テストのため）
- [ ] **保存**

### 2.3 OAuth 2.0 クライアント ID 作成

- [ ] 左メニュー **APIs & Services** → **Credentials**
- [ ] **Create Credentials** → **OAuth client ID**
- [ ] Application type: **Web application**
- [ ] Name: `YUWA Web Client`
- [ ] **Authorized JavaScript origins**:
  - `http://localhost:3000`
  - `https://yuwa.club`（ドメイン取得後に追加でも OK）
  - `https://yuwa.vercel.app` (Vercel preview 用)
- [ ] **Authorized redirect URIs**:
  - `https://<supabase-project>.supabase.co/auth/v1/callback`（**Supabase の URL に置き換え**）
  - `http://localhost:3000/auth/callback`
  - `https://yuwa.club/auth/callback`（ドメイン取得後に追加）
- [ ] 作成 → **Client ID** と **Client secret** を控える

### 2.4 Supabase 側に Google OAuth を設定

- [ ] Supabase Dashboard → **Authentication** → **Providers**
- [ ] **Google** を有効化（トグル ON）
- [ ] **Client ID** と **Client secret** を貼り付け
- [ ] **Save**

---

## 3. Vercel アカウント + GitHub 連携

### 3.1 アカウント作成

- [ ] https://vercel.com にアクセス
- [ ] **Sign up with GitHub**（`aokiyuwadayo` で）
- [ ] **Free Hobby plan**（個人利用、商用ではない）
- [ ] 組織は個人で OK

### 3.2 GitHub リポを Import

> ⚠ **注意**: この作業はエンジニアが Issue #11 で実施するので、PO がやる必要はありません。**アカウント作成だけ済ませておけば OK**。
> 
> エンジニアに「Vercel への招待」をする必要がある場合のみ、以下を実施:

- [ ] Vercel の **Team Settings** → **Members** → エンジニアの GitHub アカウントを招待
- [ ] あるいは、Vercel プロジェクト作成後に Collaborator として追加

### 3.3 環境変数の設定（後で）

エンジニアが Vercel にプロジェクトを Import したら、以下の環境変数を Vercel Dashboard で設定:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANONYMOUS_HASH_SALT`（**ローンチ前にランダム生成して固定**、後述）

---

## 4. ドメイン yuwa.club 取得

> ローンチ近くで OK（Phase 4）。ここでは推奨レジストラと手順だけ記載。

### 4.1 レジストラの選び方

| サービス | yuwa.club 年額 | 特徴 | 推奨度 |
|---|---|---|---|
| **Cloudflare Registrar** | 原価提供（≒$10-12） | 中間マージンなしで最安、Cloudflare DNS と統合 | ★★★ |
| **Porkbun** | 約 $12 | 安価、無料 WHOIS プライバシー、UI 良い | ★★★ |
| **お名前.com** | 約 1,200 円（初年）/ 約 2,500 円（更新） | 日本語サポート、ただし初年と更新で価格差大 | ★★ |
| **Google Domains** | 終了済（→ Squarespace に移行） | — | ✗ |

### 4.2 推奨: Cloudflare Registrar

- [ ] https://dash.cloudflare.com にサインアップ（青木さん）
- [ ] **Domains** → **Register Domain** → `yuwa.club` を検索
- [ ] 購入（クレジットカード）
- [ ] Cloudflare の DNS が自動で設定される

### 4.3 Vercel 側でカスタムドメインを設定（ローンチ時）

- [ ] Vercel Dashboard → プロジェクト → **Settings** → **Domains**
- [ ] `yuwa.club` を追加
- [ ] 表示される DNS レコード（A or CNAME）を Cloudflare の DNS に追加
- [ ] SSL 証明書は Vercel が自動で取得

### 4.4 yuwa.club を選んだ後の表記の統一

ドメイン取得後、以下のドキュメントで「（取得予定）」「（未取得）」となっている箇所を更新:
- README.md
- docs/business-plan.md
- docs/requirements-v0.1.md（招待 URL 例）
- docs/status-YYYY-MM-DD.md

---

## 5. シークレットの安全な共有

エンジニアに渡す必要があるシークレット:

| 項目 | どこで取る | 機密度 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Settings | 低（公開してOK） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Settings | 低（クライアント側で公開）|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Settings | **🔴 高（絶対公開しない）** |
| `ANONYMOUS_HASH_SALT` | 自分でランダム生成（後述） | **🔴 高** |
| `GOOGLE_OAUTH_CLIENT_ID` | Google Cloud Console | 中 |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google Cloud Console | **🔴 高** |
| Database Password | Supabase 作成時に控えたもの | **🔴 高** |

### 5.1 ANONYMOUS_HASH_SALT の生成

匿名ハッシュ用の固定 salt は、ローンチ前に **1 回だけ** ランダム生成して固定:

```bash
# macOS / Linux
openssl rand -base64 32

# 結果例: VR2tQX9YbZG4xK7nP3sW8jH5fL6mD1cE0aB2tU4vN5o=
```

- [ ] 上記コマンドで生成
- [ ] パスワードマネージャに保存（**絶対に失わない**、変えるとハッシュが変わり過去の匿名投稿の同一性が壊れる）

### 5.2 エンジニアへの共有方法（おすすめ順）

1. **1Password / Bitwarden の共有ボルト**（最も安全、推奨）
2. **Signal / 暗号化メッセージ**（Slack / LINE は履歴残るので非推奨）
3. **Vercel に直接 PO が入力する**（エンジニアにシークレットを渡さなくて済む、最高）

⚠ **GitHub に絶対にコミットしない**。`.env.local` は `.gitignore` で除外済みだが、誤って .env を git add しないよう注意。

### 5.3 エンジニアが受け取った後

- エンジニアは `.env.local` に貼り付け
- Vercel Dashboard の Environment Variables にも設定（PO が直接入力するなら不要）

---

## 6. 進捗チェック表

| 項目 | やった | 担当 | 完了日 | 備考 |
|---|---|---|---|---|
| Supabase アカウント作成 | ⬜ | 青木 | | |
| Supabase プロジェクト作成（Tokyo）| ⬜ | 青木 | | |
| Supabase 接続情報を控えた | ⬜ | 青木 | | |
| Google Cloud プロジェクト作成 | ⬜ | 青木 | | |
| OAuth 同意画面設定 | ⬜ | 青木 | | |
| OAuth Client ID 作成 | ⬜ | 青木 | | |
| Supabase に Google OAuth 設定 | ⬜ | 青木 | | |
| Vercel アカウント作成 | ⬜ | 青木 | | |
| ANONYMOUS_HASH_SALT 生成 | ⬜ | 青木 | | パスワードマネージャに保存 |
| シークレット共有手段の決定 | ⬜ | 青木 | | 1Password / Bitwarden / Signal |
| ドメイン yuwa.club 取得 | ⬜ | 青木 | | ローンチ近で OK |

---

## 7. 困った時

- **Supabase の Free 枠**: 月 500MB DB、月 2GB egress 等。MVP では十分。詳細 https://supabase.com/pricing
- **Google OAuth でエラー**: redirect URI のドット・スラッシュの違いに注意。Supabase の URL を正確にコピー
- **Vercel の Hobby plan**: 商用利用不可だが、学生サークルの非営利ツールなら OK の範囲。気になるなら Vercel Sales に確認
- **不安があったら**: エンジニアと相談しながら進めて OK

---

## 8. 関連ドキュメント

- [`roadmap.md §7 エンジニア向け環境セットアップ手順`](roadmap.md)
- [`CONTRIBUTING.md §3 ローカル開発のセットアップ`](../CONTRIBUTING.md)
- [`requirements-v0.1.md §6 認証フロー`](requirements-v0.1.md)
- 関連 Issue:
  - [#8 Supabase プロジェクト作成 + 環境変数整備](https://github.com/aokiyuwadayo/yuwa/issues/8)
  - [#9 Google OAuth クライアント作成](https://github.com/aokiyuwadayo/yuwa/issues/9)
  - [#11 Vercel preview デプロイ環境構築](https://github.com/aokiyuwadayo/yuwa/issues/11)
