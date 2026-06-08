import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  CATEGORY_LABELS,
  type PostCategory,
  type PostStatus,
} from "@/lib/post-categories";

// 意見箱のデータアクセス層（server 専用）。
// PostgREST のネスト埋め込みは壊れやすいため、素直なクエリ＋JS 結合で組む。
// RLS により posts / post_reactions はいずれも自 organization・承認済みに絞られる。
//
// カテゴリ定数・型は client からも使うため @/lib/post-categories に分離している。
export {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  isPostCategory,
} from "@/lib/post-categories";
export type { PostCategory, PostStatus } from "@/lib/post-categories";

export interface PostRow {
  id: string;
  organization_id: string;
  is_anonymous: boolean;
  category: PostCategory;
  body: string;
  status: PostStatus;
  created_at: string;
}

export interface PostView extends PostRow {
  categoryLabel: string;
  reactionCount: number;
  reactedByMe: boolean;
}

/**
 * 承認済み投稿の一覧（新しい順）。category 指定でカテゴリ絞り込み。
 * リアクション件数と「自分が押したか」を付与する。
 */
export async function listApprovedPosts(
  category?: PostCategory,
): Promise<PostView[]> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("posts")
    .select(
      "id, organization_id, is_anonymous, category, body, status, created_at",
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data: posts, error } = await query;
  if (error || !posts || posts.length === 0) return [];

  const postIds = posts.map((p) => p.id);

  // リアクション件数: post_id のみ select 可能（member_id は読めない設計）。
  const { data: reactions } = await supabase
    .from("post_reactions")
    .select("post_id")
    .in("post_id", postIds);

  const countByPost = new Map<string, number>();
  for (const r of reactions ?? []) {
    countByPost.set(r.post_id, (countByPost.get(r.post_id) ?? 0) + 1);
  }

  // 自分のリアクション状態は RPC 経由（member_id を直接 select できないため）。
  const { data: myReacted } = await supabase.rpc("my_reacted_post_ids");
  const myReactedSet = new Set<string>(
    Array.isArray(myReacted) ? (myReacted as string[]) : [],
  );

  return (posts as PostRow[]).map((post) => ({
    ...post,
    categoryLabel: CATEGORY_LABELS[post.category],
    reactionCount: countByPost.get(post.id) ?? 0,
    reactedByMe: myReactedSet.has(post.id),
  }));
}
