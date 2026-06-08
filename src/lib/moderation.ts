import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentMember, type CurrentMember } from "@/lib/member";
import { shortenHash } from "@/lib/anonymous-hash";
import { CATEGORY_LABELS, type PostCategory } from "@/lib/post-categories";

// モデレーション層。
// author_hash 全体や rejected 件数の集計は authenticated には grant されていない
// ため、service_role (admin client) で参照する。full hash は決してクライアントに
// 渡さず、先頭 4 文字（shortenHash）と件数のみを返す。

export interface ModerationPostView {
  id: string;
  authorHashPrefix: string; // 先頭 4 文字のみ（例: "a3f9…"）
  isAnonymous: boolean;
  category: PostCategory;
  categoryLabel: string;
  body: string;
  createdAt: string;
  authorRejectedCount: number; // 同一 author_hash の rejected 件数（違反履歴）
}

/**
 * 現在のメンバーがモデレーター/管理者であれば返す。そうでなければ null。
 */
export async function requireModerator(): Promise<CurrentMember | null> {
  const member = await getCurrentMember();
  if (!member) return null;
  if (member.role !== "moderator" && member.role !== "admin") return null;
  return member;
}

/**
 * 承認待ち（pending）投稿の一覧（古い順）。
 * 投稿者は匿名ハッシュ先頭 4 文字のみ。違反履歴として rejected 件数を付与。
 */
export async function listPendingModerationPosts(
  organizationId: string,
): Promise<ModerationPostView[]> {
  const admin = createSupabaseAdminClient();

  const { data: pending, error } = await admin
    .from("posts")
    .select("id, author_hash, is_anonymous, category, body, created_at")
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error || !pending || pending.length === 0) return [];

  // 違反履歴: 同一 author_hash の rejected 件数を集計（full hash はここで完結）。
  const { data: rejected } = await admin
    .from("posts")
    .select("author_hash")
    .eq("organization_id", organizationId)
    .eq("status", "rejected");

  const rejectedByHash = new Map<string, number>();
  for (const r of rejected ?? []) {
    rejectedByHash.set(
      r.author_hash,
      (rejectedByHash.get(r.author_hash) ?? 0) + 1,
    );
  }

  return pending.map((post) => {
    const category = post.category as PostCategory;
    return {
      id: post.id,
      authorHashPrefix: shortenHash(post.author_hash),
      isAnonymous: post.is_anonymous,
      category,
      categoryLabel: CATEGORY_LABELS[category],
      body: post.body,
      createdAt: post.created_at,
      authorRejectedCount: rejectedByHash.get(post.author_hash) ?? 0,
    };
  });
}
