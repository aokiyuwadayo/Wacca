# YUWA ブランドアセット

このディレクトリには YUWA のロゴ・ファビコン・OG image 等のソース SVG が入っています。

> 📘 ブランドの使い方ガイドラインは [`../brand-guidelines.md`](../brand-guidelines.md) を参照してください。

## ファイル一覧

| ファイル | 用途 | サイズ |
|---|---|---|
| `logo.svg` | プライマリロゴ（インディゴ #4F46E5） | 280×80 |
| `logo-white.svg` | 暗背景用ロゴ（白） | 280×80 |
| `logo-black.svg` | 強コントラスト用ロゴ（gray-900） | 280×80 |
| `favicon.svg` | ファビコン（小サイズ用） | 32×32 |
| `icon-512.svg` | アプリアイコン（PWA / 大サイズ） | 512×512 |
| `og-image-template.svg` | SNS シェア用 OG image テンプレート | 1200×630 |

## エンジニア向け: Next.js プロジェクトへの配置

Next.js 初期化後、これらのファイルを `public/` 配下にコピー・変換してください:

```bash
# SVG はそのまま public/ にコピー
cp docs/brand/logo.svg public/
cp docs/brand/favicon.svg public/
cp docs/brand/icon-512.svg public/

# PNG が必要な場合（OG image / app icon / fallback favicon）
# ImageMagick or rsvg-convert で変換:
brew install librsvg
rsvg-convert -h 32  docs/brand/favicon.svg -o public/favicon.png
rsvg-convert -h 512 docs/brand/icon-512.svg -o public/apple-touch-icon.png
rsvg-convert -h 630 docs/brand/og-image-template.svg -o public/og-image.png
```

### `app/layout.tsx` での参照例

```tsx
export const metadata: Metadata = {
  title: 'YUWA',
  description: 'サークル運営を、もっと温かく。',
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'YUWA',
    description: 'サークル運営を、もっと温かく。',
    url: 'https://yuwa.club',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
}
```

## 注意

- SVG のフォント指定はシステムフォントに依存します。本番の OG image を作る場合は、サーバーサイドレンダリング（Vercel OG 等）または事前にフォント埋め込み版を生成することを推奨します
- ロゴをラスタライズしたい場合（PNG/JPG）、ベクター → ラスター変換時に文字が崩れることがあるため、フォントを path 化してから変換するのが安全です
- 本格的なブランド展開（ロゴリファイン、アイコンマーク追加等）はデザイナーに依頼する方針です

## ライセンス・帰属

このディレクトリ内のアセットは YUWA プロジェクトのものであり、外部からの複製・転用には PO（青木）への確認をお願いします（詳細はリポルートの LICENSE を確認。未定の場合はデフォルト All Rights Reserved）。
