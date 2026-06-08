"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/member";
import { isPostCategory } from "@/lib/posts";

export interface CreatePostState {
  ok: boolean;
  error?: string;
}

/**
 * 意見の新規投稿。status は DB 既定の 'pending'、author_hash は
 * set_post_author_metadata トリガが members.anonymous_hash から自動設定する。
 * BAN 済みハッシュは同トリガが例外送出して弾く。
 */
export async function createPost(
  _prev: CreatePostState,
  formData: FormData,
): Promise<CreatePostState> {
  const member = await getCurrentMember();
  if (!member) {
    return { ok: false, error: "ログインが必要です。" };
  }

  const category = formData.get("category");
  const body = (formData.get("body") ?? "").toString().trim();
  // チェックボックス "named" が on のときだけ記名。既定は匿名。
  const isAnonymous = formData.get("named") !== "on";

  if (!isPostCategory(category)) {
    return { ok: false, error: "カテゴリを選択してください。" };
  }
  if (body.length < 1) {
    return { ok: false, error: "本文を入力してください。" };
  }
  if (body.length > 4000) {
    return { ok: false, error: "本文は 4000 文字以内で入力してください。" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("posts").insert({
    organization_id: member.organization_id,
    author_member_id: member.id,
    is_anonymous: isAnonymous,
    category,
    body,
  });

  if (error) {
    if (error.message.includes("banned")) {
      return {
        ok: false,
        error: "現在この操作は制限されています。運営にお問い合わせください。",
      };
    }
    return {
      ok: false,
      error: "投稿に失敗しました。時間をおいて再度お試しください。",
    };
  }

  revalidatePath("/posts");
  revalidatePath("/admin/moderation");
  return { ok: true };
}

export interface ToggleReactionResult {
  ok: boolean;
  reacted: boolean;
  error?: string;
}

/**
 * 🫶 リアクションのトグル。1 メンバー = 1 リアクション/投稿（PK 制約）。
 * 削除は RLS (member_id = auth.uid()) に絞り込みを委ねる。member_id は
 * authenticated に select 権限が無いため WHERE では使わない。
 */
export async function toggleReaction(
  postId: string,
): Promise<ToggleReactionResult> {
  const member = await getCurrentMember();
  if (!member) {
    return { ok: false, reacted: false, error: "ログインが必要です。" };
  }

  const supabase = await createSupabaseServerClient();

  const { data: myReacted } = await supabase.rpc("my_reacted_post_ids");
  const alreadyReacted =
    Array.isArray(myReacted) && (myReacted as string[]).includes(postId);

  if (alreadyReacted) {
    const { error } = await supabase
      .from("post_reactions")
      .delete()
      .eq("post_id", postId);
    if (error) {
      return { ok: false, reacted: true, error: "更新に失敗しました。" };
    }
    revalidatePath("/posts");
    return { ok: true, reacted: false };
  }

  const { error } = await supabase
    .from("post_reactions")
    .insert({ post_id: postId, member_id: member.id });
  if (error) {
    return { ok: false, reacted: false, error: "更新に失敗しました。" };
  }
  revalidatePath("/posts");
  return { ok: true, reacted: true };
}
