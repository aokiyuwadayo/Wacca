# YUWA ブランドビジュアル・ガイドライン

> **ステータス**: v1 ドラフト（実装時に微調整可能）
> **作成日**: 2026-05-25
> **作成者**: 青木（PO）
> **対象**: エンジニア（UI 実装時の参照）、デザイナー（将来のロゴリファイン時）、運営チーム（発信時のトーン参照）

---

## 1. ブランドの精神

YUWA は **「結ばれた和」** を表すブランド。設計の根底には:

| キーワード | UI/言葉で表現する形 |
|---|---|
| **温かい** | 柔らかい角丸、暖色系のアクセント、絵文字は控えめに使う |
| **モダン** | 余白を活かす、過度な装飾を避ける、Sans-serif 中心 |
| **誠実** | コントラスト確保（アクセシビリティ）、誤魔化さない表現 |
| **学生らしい身近さ** | です・ます調基本だが堅すぎない、過度な敬語回避 |

避けたいトーン:
- ⛔ ゴージャス・派手（祭り感）
- ⛔ ビジネス過ぎる（堅苦しい SaaS 感）
- ⛔ ふざけすぎ（流行語多用、絵文字過剰）

---

## 2. ロゴ

### 基本仕様

- **テキストロゴ**: `YUWA`（全大文字、4 文字、トラッキング微広め）
- 当面はテキストロゴのみ。シンボル / アイコンマークは別途デザイナーに依頼

### 推奨フォント

```
Inter (700 Bold)
or
Zen Kaku Gothic New (700 Bold)
```

英語表記時は Inter、日本語と並べる時は Zen Kaku Gothic New を選ぶと統一感が出る。

### ロゴ表記の例

```
YUWA               ← デフォルト
yuwa.club          ← URL 表記時
YUWA (ゆうわ)      ← About ページ等で読みを示す時
YUWA (結×和)        ← 由来を示す時
```

### NG な使い方

- ❌ `Yuwa` `yuwa`（一般文中は OK だが、ロゴとしては YUWA）
- ❌ 半角の `Y U W A`（スペース区切り）
- ❌ 文字の色や形を歪める
- ❌ 角丸の枠で囲ったり下線を引く

---

## 3. カラーパレット

Tailwind CSS のデフォルト色を活用し、設定を最小化する方針。

### プライマリ

```
Primary (Brand)
HEX: #4F46E5    Tailwind: indigo-600
RGB: 79 70 229

用途: 主要ボタン、リンク、強調エリア、ロゴ
意図: 信頼感・落ち着き・知性
```

### アクセント

```
Accent (Warm)
HEX: #F59E0B    Tailwind: amber-500
RGB: 245 158 11

用途: ハイライト（「新着」「おすすめ」のバッジ）、絵文字代替の強調
意図: 温かみ・親しみ・「居場所感」
```

### グレースケール（テキスト・背景）

```
Background:       #FFFFFF (white)        or #F9FAFB (gray-50)
Surface:          #FFFFFF (white)
Border:           #E5E7EB (gray-200)
Text Primary:     #111827 (gray-900)
Text Secondary:   #6B7280 (gray-500)
Text Disabled:    #9CA3AF (gray-400)
```

### 状態色（フィードバック用）

```
Success:  #10B981  Tailwind: emerald-500   （「承認」「成功」）
Warning:  #F59E0B  Tailwind: amber-500     （「保留」「要注意」）
Error:    #EF4444  Tailwind: red-500       （「却下」「エラー」）
Info:     #3B82F6  Tailwind: blue-500      （「情報」「お知らせ」）
```

### ダークモード（将来対応）

v0.1 ではダークモード未対応。実装時に検討する場合は、`#0F172A` (slate-900) ベース。

---

## 4. タイポグラフィ

### フォントファミリー

```css
/* CSS variables 推奨 */
--font-sans-jp: "Zen Kaku Gothic New", "Hiragino Sans", "Yu Gothic UI",
                sans-serif;
--font-sans-en: "Inter", "Helvetica Neue", Arial, sans-serif;
--font-mono:    "JetBrains Mono", "Menlo", monospace;
```

### 使い分け

- **日英混在の本文** → `font-sans-jp`（Zen Kaku Gothic New）
- **英語主体の見出し / ロゴ** → `font-sans-en`（Inter）
- **コードブロック・ID 等** → `font-mono`（JetBrains Mono）

### サイズスケール（Tailwind の標準を尊重）

| 用途 | クラス | サイズ |
|---|---|---|
| ヒーロー見出し | `text-4xl` / `text-5xl` | 36-48px |
| ページ見出し H1 | `text-3xl` | 30px |
| セクション見出し H2 | `text-2xl` | 24px |
| サブ見出し H3 | `text-xl` | 20px |
| 本文 | `text-base` | 16px |
| 補足 | `text-sm` | 14px |
| キャプション | `text-xs` | 12px |

### Google Fonts での読み込み例

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

---

## 5. スペーシング・形

### Border Radius

| 要素 | クラス | 用途 |
|---|---|---|
| ボタン・入力欄 | `rounded-lg` (8px) | 標準 |
| カード | `rounded-xl` (12px) | 柔らかさ重視 |
| バッジ | `rounded-full` | ピル型 |
| アバター | `rounded-full` | 円形 |

「ピリッと角ばった」より「ふんわり柔らかい」方向。

### Shadow

控えめに。Tailwind の `shadow-sm` / `shadow-md` を主に。`shadow-2xl` は使わない（YUWA の精神に合わない）。

### Spacing（余白の取り方）

- セクション間: `space-y-12` 以上（48px+）で「読みやすい間」を作る
- カード内: `p-6` (24px) 推奨
- ボタン: `px-4 py-2` 程度、過度に詰めない

---

## 6. アイコン

### 推奨ライブラリ

**Lucide Icons** (https://lucide.dev/)

理由:
- shadcn/ui のデフォルト
- 一貫したラインデザインで品がある
- 1500+ アイコンで十分なカバレッジ
- ライセンス: ISC（商用利用 OK）

### 使うアイコンの方針

- **線の太さは統一**（Lucide のデフォルトの 2px ストロークを維持）
- **意味が明確なもの** を選ぶ（装飾目的でアイコン濫用しない）
- **絵文字との併用は最小限**（テキストロゴと同じく、過剰使用は避ける）

### よく使う想定アイコン

| 用途 | Lucide |
|---|---|
| 意見箱 | `MessageSquare` |
| イベント | `Calendar` |
| 出欠 | `ListChecks` |
| 名簿 | `Users` |
| プロフィール | `User` |
| 設定 | `Settings` |
| モデレーション | `ShieldCheck` |
| 承認 | `Check` |
| 却下 | `X` |
| 通知 | `Bell` |

---

## 7. 絵文字の使い方

ドキュメント・通知・UI 内での絵文字は **使う、ただし控えめに**。

### 推奨

- 区切り感が必要なリスト項目（例: 🗣️ 意見箱 / 📅 イベント / 🛡️ モデレーション）
- お祝い・感謝のメッセージ（🎉 ようこそ / 🙏 ありがとう）
- カテゴリ識別（💡 アイデア / 📣 要望）

### 非推奨

- 1 つの段落に 3 つ以上の絵文字
- リアクション以外の主要 UI（ボタンラベル等）
- 状態を示す主要要素（色 + テキストで十分）

---

## 8. トーン & マナー

### 文体

- 基本は **です・ます調**
- 堅すぎない：「〜してくださいませ」より「〜してください」
- 親しみ：「皆さんの声をお待ちしています」のような柔らかさ
- 命令形は避ける：「投稿してください」◯ / 「投稿しろ」✗

### 一人称・呼称

- 運営 → メンバー: 「皆さん」「〇〇さん」（呼び捨て NG）
- メンバー → 運営: 「運営チーム」
- システム → ユーザー: 「あなた」より「YUWA からのお知らせ」のような物言い

### 通知・お知らせの例

```
✅ 良い例
「あなたの投稿が公開されました 🎉」
「ご意見ありがとうございます。運営チームが内容を確認します。」

❌ 悪い例
「投稿成功」                    ← 機械的すぎる
「やったね！投稿できたよ〜🎉🎉🎉」← カジュアル過ぎる
「Your post has been published」← 英語混在
「投稿者: ユーザー_a3f9」      ← ハッシュ ID をそのまま見せない
```

---

## 9. アクセシビリティ

- **コントラスト比 WCAG AA 以上**（本文 4.5:1、大文字 3:1）
- 重要操作は色だけでなく **テキスト・アイコンでも識別**できる
- フォーカスリングを消さない（キーボードユーザーのため）
- 画像には alt 属性必須

参考: https://www.w3.org/WAI/WCAG21/quickref/

---

## 10. 実装メモ（エンジニア向け）

### Tailwind の設定

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [...],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#4F46E5',  // indigo-600
          light:   '#818CF8',  // indigo-400
          dark:    '#3730A3',  // indigo-800
        },
        accent: {
          DEFAULT: '#F59E0B',  // amber-500
        },
      },
      fontFamily: {
        sans:    ['"Zen Kaku Gothic New"', '"Inter"', 'sans-serif'],
        display: ['"Inter"', '"Zen Kaku Gothic New"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
}
export default config
```

### shadcn/ui との関係

- shadcn/ui の `neutral` テーマをベース、`primary` を `indigo-600` にカスタマイズ
- `pnpm dlx shadcn@latest init` の際に上記カラーを指定

---

## 11. 変更履歴

| 日付 | 変更 |
|---|---|
| 2026-05-25 | v1 初版作成（青木）|
