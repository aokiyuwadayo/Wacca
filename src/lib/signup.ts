import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const INVITE_COOKIE = "yuwa_invite";

export type EnsureMemberResult = "exists" | "created" | "no_invite";

/**
 * Google OAuth 後に呼ばれ、members 行が無ければ招待コードを検証して作成する。
 * RLS をバイパスするため service_role(admin) クライアントを使う（admin.ts 参照）。
 * requirements-v0.1.md §6「新規メンバーの加入」フローの実装。
 */
export async function ensureMemberForUser(
  userId: string,
  meta: Record<string, unknown> | undefined,
): Promise<EnsureMemberResult> {
  const admin = createSupabaseAdminClient();

  // 既に member なら何もしない（再訪問ログイン）。
  const { data: existing } = await admin
    .from("members")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (existing) return "exists";

  const cookieStore = await cookies();
  const code = cookieStore.get(INVITE_COOKIE)?.value?.toUpperCase();
  if (!code) return "no_invite";

  // 招待コードの検証（存在・未期限・残回数）。
  const { data: invite } = await admin
    .from("invite_codes")
    .select("code, organization_id, max_uses, used_count, expires_at")
    .eq("code", code)
    .maybeSingle();
  if (
    !invite ||
    new Date(invite.expires_at).getTime() <= Date.now() ||
    invite.used_count >= invite.max_uses
  ) {
    return "no_invite";
  }

  // 匿名ハッシュは DB 関数に集約（anonymous-hash.ts のコメント参照）。
  const { data: hash, error: hashError } = await admin.rpc(
    "generate_member_anonymous_hash",
    { member_id: userId, member_organization_id: invite.organization_id },
  );
  if (hashError || !hash) {
    throw new Error(hashError?.message ?? "anonymous_hash の生成に失敗しました");
  }

  const { error: insertError } = await admin.from("members").insert({
    id: userId,
    organization_id: invite.organization_id,
    display_name: deriveDisplayName(meta),
    role: "member",
    invite_code: invite.code,
    anonymous_hash: hash as string,
    status: "active",
  });
  if (insertError) throw new Error(insertError.message);

  // used_count をインクリメント（簡易・楽観的。将来は原子的 RPC に置換余地）。
  await admin
    .from("invite_codes")
    .update({ used_count: invite.used_count + 1 })
    .eq("code", invite.code);

  cookieStore.delete(INVITE_COOKIE);
  return "created";
}

function deriveDisplayName(meta: Record<string, unknown> | undefined): string {
  const raw =
    (meta?.full_name as string) ||
    (meta?.name as string) ||
    (meta?.email as string) ||
    "メンバー";
  const trimmed = String(raw).trim().slice(0, 80);
  return trimmed.length > 0 ? trimmed : "メンバー";
}
