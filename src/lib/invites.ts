import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentMember, type CurrentMember } from "@/lib/member";

// 招待コード管理層（requirements-v0.1.md ユーザーストーリー 7）。
// invite_codes の RLS は「使用可能なコードのみ select 可」なので、
// 使い切り・期限切れを含む全件の一覧は service_role (admin client) で参照する。

export type InviteCodeStatus = "active" | "exhausted" | "expired";

export interface InviteCodeView {
  code: string;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  createdAt: string;
  issuedByName: string | null;
  status: InviteCodeStatus;
  /** このコードで加入したメンバー（誰が招待経由で入ったかの把握）。 */
  joinedMembers: { displayName: string; joinedAt: string }[];
}

/**
 * 現在のメンバーが管理者であれば返す。そうでなければ null。
 * 招待コードの発行・無効化は admin のみ（モデレーターは投稿の管理まで）。
 */
export async function requireAdmin(): Promise<CurrentMember | null> {
  const member = await getCurrentMember();
  if (!member) return null;
  if (member.role !== "admin") return null;
  return member;
}

/**
 * 団体の招待コード一覧（新しい順）。加入メンバーと発行者名を付与する。
 */
export async function listInviteCodes(
  organizationId: string,
): Promise<InviteCodeView[]> {
  const admin = createSupabaseAdminClient();

  const { data: codes, error } = await admin
    .from("invite_codes")
    .select("code, issued_by, max_uses, used_count, expires_at, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error || !codes || codes.length === 0) return [];

  const { data: members } = await admin
    .from("members")
    .select("id, display_name, invite_code, joined_at")
    .eq("organization_id", organizationId);

  const nameById = new Map<string, string>();
  const joinedByCode = new Map<
    string,
    { displayName: string; joinedAt: string }[]
  >();
  for (const m of members ?? []) {
    nameById.set(m.id, m.display_name);
    if (m.invite_code) {
      const list = joinedByCode.get(m.invite_code) ?? [];
      list.push({ displayName: m.display_name, joinedAt: m.joined_at });
      joinedByCode.set(m.invite_code, list);
    }
  }

  const now = Date.now();
  return codes.map((c) => ({
    code: c.code,
    maxUses: c.max_uses,
    usedCount: c.used_count,
    expiresAt: c.expires_at,
    createdAt: c.created_at,
    issuedByName: c.issued_by ? (nameById.get(c.issued_by) ?? null) : null,
    status:
      c.used_count >= c.max_uses
        ? "exhausted"
        : new Date(c.expires_at).getTime() <= now
          ? "expired"
          : "active",
    joinedMembers: (joinedByCode.get(c.code) ?? []).sort((a, b) =>
      a.joinedAt.localeCompare(b.joinedAt),
    ),
  }));
}
