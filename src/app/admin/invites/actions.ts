"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/invites";

export interface CreateInviteState {
  ok: boolean;
  error?: string;
  /** 発行直後のコード。UI で招待 URL として案内する。 */
  code?: string;
}

// 読み間違えやすい文字 (I/L/O/0/1) を除いた英大文字+数字。
// invite_codes の check 制約 ^[A-Z0-9]{6,32}$ の部分集合。
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

function generateInviteCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

/** 招待コードを発行する。admin のみ。 */
export async function createInviteCode(
  _prev: CreateInviteState,
  formData: FormData,
): Promise<CreateInviteState> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "権限がありません。" };

  const maxUses = Number(formData.get("max_uses") ?? 1);
  const expiresInDays = Number(formData.get("expires_in_days") ?? 14);

  if (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 100) {
    return { ok: false, error: "使用回数は 1〜100 で入力してください。" };
  }
  if (
    !Number.isInteger(expiresInDays) ||
    expiresInDays < 1 ||
    expiresInDays > 90
  ) {
    return { ok: false, error: "有効期間は 1〜90 日で入力してください。" };
  }

  const client = createSupabaseAdminClient();
  const expiresAt = new Date(
    Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  // code は主キーなので、衝突（23505）時のみ再生成してリトライする。
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateInviteCode();
    const { error } = await client.from("invite_codes").insert({
      code,
      organization_id: admin.organization_id,
      issued_by: admin.id,
      max_uses: maxUses,
      expires_at: expiresAt,
    });

    if (!error) {
      revalidatePath("/admin/invites");
      return { ok: true, code };
    }
    if (error.code !== "23505") {
      return { ok: false, error: "招待コードの発行に失敗しました。" };
    }
  }
  return { ok: false, error: "招待コードの発行に失敗しました。" };
}

export interface RevokeInviteResult {
  ok: boolean;
  error?: string;
}

/** 招待コードを無効化する（expires_at を現在時刻にして即時失効）。admin のみ。 */
export async function revokeInviteCode(
  code: string,
): Promise<RevokeInviteResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "権限がありません。" };

  const client = createSupabaseAdminClient();
  const { data: updated, error } = await client
    .from("invite_codes")
    .update({ expires_at: new Date().toISOString() })
    .eq("code", code)
    .eq("organization_id", admin.organization_id)
    .gt("expires_at", new Date().toISOString())
    .select("code")
    .maybeSingle();

  if (error) return { ok: false, error: "無効化に失敗しました。" };
  if (!updated) {
    return { ok: false, error: "この招待コードはすでに失効しています。" };
  }

  revalidatePath("/admin/invites");
  return { ok: true };
}
