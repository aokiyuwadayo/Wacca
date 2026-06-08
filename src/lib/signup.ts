import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const INVITE_COOKIE = "yuwa_invite";

export type EnsureMemberResult = "exists" | "created" | "no_invite";

/**
 * Google OAuth 後に呼ばれ、members 行が無ければ招待コードを検証して作成する。
 * RLS をバイパスするため service_role(admin) クライアントを使う（admin.ts 参照）。
 * requirements-v0.1.md §6「新規メンバーの加入」フローの実装。
 *
 * 招待の消費と member 作成は DB 関数 redeem_invite_and_create_member に集約し、
 * 1 トランザクションでアトミックに行う（招待コードの二重消費レースを防ぐ。
 * migration 011 のコメント参照）。
 */
export async function ensureMemberForUser(
  userId: string,
  meta: Record<string, unknown> | undefined,
): Promise<EnsureMemberResult> {
  const admin = createSupabaseAdminClient();
  const cookieStore = await cookies();

  // cookie が無い再ログインでも RPC 側の冪等チェックで "exists" を返せるよう、
  // 招待コードは空文字でも渡す（空文字は invite_codes に一致しない）。
  const code = cookieStore.get(INVITE_COOKIE)?.value?.toUpperCase() ?? "";

  const { data, error } = await admin.rpc("redeem_invite_and_create_member", {
    p_code: code,
    p_user_id: userId,
    p_display_name: deriveDisplayName(meta),
  });
  if (error) {
    throw new Error(error.message);
  }

  const result = data as EnsureMemberResult;

  // 加入できた / 既存メンバーなら招待 cookie は不要。
  if (result === "created" || result === "exists") {
    cookieStore.delete(INVITE_COOKIE);
  }

  return result;
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
