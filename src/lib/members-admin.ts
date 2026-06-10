import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// メンバー名簿の管理層（requirements-v0.1.md ユーザーストーリー 10）。
// 状態を問わず全メンバー（left 含む）を一覧するため service_role で参照する。
// RLS の select は current_member_organization_id() = active 限定なので、
// left メンバーは authenticated からは見えない。

export type MemberStatus = "active" | "suspended" | "left";

export interface MemberRosterView {
  id: string;
  displayName: string;
  role: "member" | "moderator" | "admin";
  status: MemberStatus;
  joinedAt: string;
  inviteCode: string | null;
}

/**
 * 団体のメンバー名簿（加入日昇順）。left / suspended も含む。
 */
export async function listMembers(
  organizationId: string,
): Promise<MemberRosterView[]> {
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("members")
    .select("id, display_name, role, status, joined_at, invite_code")
    .eq("organization_id", organizationId)
    .order("joined_at", { ascending: true });

  if (error || !data) return [];

  return data.map((m) => ({
    id: m.id,
    displayName: m.display_name,
    role: m.role,
    status: m.status,
    joinedAt: m.joined_at,
    inviteCode: m.invite_code,
  }));
}
