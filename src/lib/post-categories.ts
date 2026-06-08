// 意見箱のカテゴリ/ステータス定義。
// server 専用モジュール（next/headers 依存）を巻き込まないよう、client component
// からも import できる純粋な定数・型だけをここに置く。

export type PostCategory = "request" | "idea" | "other";
export type PostStatus = "pending" | "approved" | "rejected" | "edit_requested";

export const CATEGORY_LABELS: Record<PostCategory, string> = {
  request: "運営への要望",
  idea: "アイデア",
  other: "その他",
};

export const CATEGORY_ORDER: PostCategory[] = ["request", "idea", "other"];

export function isPostCategory(value: unknown): value is PostCategory {
  return value === "request" || value === "idea" || value === "other";
}
