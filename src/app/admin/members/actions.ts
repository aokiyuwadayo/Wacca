"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/invites";

export interface MemberStatusResult {
  ok: boolean;
  error?: string;
}

/**
 * メンバーを脱退処理する（status = 'left'）。admin のみ。
 * RLS ヘルパが status='active' 限定のため、left にした時点で本人の
 * アクセスは全面的に失効する。投稿・リアクションはそのまま残る。
 */
export async function markMemberLeft(
  memberId: string,
): Promise<MemberStatusResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "権限がありません。" };

  // 自分自身を脱退させると admin が誰もいなくなりうるため禁止。
  if (memberId === admin.id) {
    return { ok: false, error: "自分自身は脱退処理できません。" };
  }

  const client = createSupabaseAdminClient();
  const { data: updated, error } = await client
    .from("members")
    .update({ status: "left" })
    .eq("id", memberId)
    .eq("organization_id", admin.organization_id)
    .eq("status", "active")
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: "脱退処理に失敗しました。" };
  if (!updated) {
    return { ok: false, error: "対象のメンバーはすでに処理済みです。" };
  }

  revalidatePath("/admin/members");
  return { ok: true };
}

/**
 * 脱退済みメンバーを復帰させる（status = 'active'）。admin のみ。
 * 誤操作の取り消しと、卒業後の再加入（新しい招待なしで戻す）に使う。
 */
export async function reactivateMember(
  memberId: string,
): Promise<MemberStatusResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "権限がありません。" };

  const client = createSupabaseAdminClient();
  const { data: updated, error } = await client
    .from("members")
    .update({ status: "active" })
    .eq("id", memberId)
    .eq("organization_id", admin.organization_id)
    .eq("status", "left")
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: "復帰に失敗しました。" };
  if (!updated) {
    return { ok: false, error: "対象のメンバーは脱退済みではありません。" };
  }

  revalidatePath("/admin/members");
  return { ok: true };
}
