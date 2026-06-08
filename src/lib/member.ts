import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * ログイン中ユーザーに対応する members 行。
 * 認証(#13 サインアップフロー)がまだ無いため、現状では基本的に null になる。
 * UI 側は「未ログイン/会員でない」状態を扱える前提で使う。
 */
export interface CurrentMember {
  id: string;
  organization_id: string;
  display_name: string;
  role: "member" | "moderator" | "admin";
}

export async function getCurrentMember(): Promise<CurrentMember | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("members")
    .select("id, organization_id, display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data as CurrentMember;
}
