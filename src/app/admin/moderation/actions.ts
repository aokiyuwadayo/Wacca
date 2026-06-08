"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireModerator } from "@/lib/moderation";

export interface ModerationResult {
  ok: boolean;
  error?: string;
}

/**
 * 投稿を承認して公開する。posts_approved_state_check により approved 時は
 * approved_by / approved_at の両方が必須。
 */
export async function approvePost(postId: string): Promise<ModerationResult> {
  const moderator = await requireModerator();
  if (!moderator) return { ok: false, error: "権限がありません。" };

  const admin = createSupabaseAdminClient();

  const { error } = await admin
    .from("posts")
    .update({
      status: "approved",
      approved_by: moderator.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .eq("organization_id", moderator.organization_id)
    .eq("status", "pending");
  if (error) return { ok: false, error: "承認に失敗しました。" };

  await admin.from("moderation_actions").insert({
    post_id: postId,
    moderator_id: moderator.id,
    action: "approve",
  });

  revalidatePath("/admin/moderation");
  revalidatePath("/posts");
  return { ok: true };
}

/**
 * 投稿を却下する（非公開のまま）。
 */
export async function rejectPost(
  postId: string,
  reason?: string,
): Promise<ModerationResult> {
  const moderator = await requireModerator();
  if (!moderator) return { ok: false, error: "権限がありません。" };

  const admin = createSupabaseAdminClient();

  const { error } = await admin
    .from("posts")
    .update({ status: "rejected" })
    .eq("id", postId)
    .eq("organization_id", moderator.organization_id)
    .eq("status", "pending");
  if (error) return { ok: false, error: "却下に失敗しました。" };

  await admin.from("moderation_actions").insert({
    post_id: postId,
    moderator_id: moderator.id,
    action: "reject",
    reason: reason?.trim() || null,
  });

  revalidatePath("/admin/moderation");
  return { ok: true };
}

/**
 * 投稿者の匿名ハッシュを BAN する。以降その投稿者の投稿はトリガで弾かれる。
 * author_hash 全体は通常運用では運営も見られないが、BAN 操作のみ service_role で
 * 参照する（規約 第 4 条に基づく対応）。同一ハッシュの承認待ち投稿もまとめて却下。
 */
export async function banPostAuthor(
  postId: string,
  reason?: string,
): Promise<ModerationResult> {
  const moderator = await requireModerator();
  if (!moderator) return { ok: false, error: "権限がありません。" };

  const admin = createSupabaseAdminClient();

  const { data: post, error: fetchError } = await admin
    .from("posts")
    .select("author_hash")
    .eq("id", postId)
    .eq("organization_id", moderator.organization_id)
    .maybeSingle();
  if (fetchError || !post) {
    return { ok: false, error: "対象の投稿が見つかりません。" };
  }

  const { error: banError } = await admin.from("banned_hashes").upsert(
    {
      organization_id: moderator.organization_id,
      hash: post.author_hash,
      banned_by: moderator.id,
      reason: reason?.trim() || null,
    },
    { onConflict: "organization_id,hash", ignoreDuplicates: true },
  );
  if (banError) return { ok: false, error: "BAN に失敗しました。" };

  // 同一ハッシュの承認待ち投稿をまとめて却下
  await admin
    .from("posts")
    .update({ status: "rejected" })
    .eq("organization_id", moderator.organization_id)
    .eq("author_hash", post.author_hash)
    .eq("status", "pending");

  await admin.from("moderation_actions").insert({
    post_id: postId,
    moderator_id: moderator.id,
    action: "ban_hash",
    reason: reason?.trim() || null,
  });

  revalidatePath("/admin/moderation");
  revalidatePath("/posts");
  return { ok: true };
}
