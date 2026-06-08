import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureMemberForUser } from "@/lib/signup";

/**
 * Google OAuth のリダイレクト先。認可コードをセッションに交換し、
 * 未登録なら招待コード(cookie)を検証して member を作成する。
 * requirements-v0.1.md §6 のフロー。
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/join?error=missing_code`);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/join?error=auth`);
  }

  const result = await ensureMemberForUser(
    data.user.id,
    data.user.user_metadata,
  );

  if (result === "no_invite") {
    // セッションは張られているが member が無い → 招待が必要。
    return NextResponse.redirect(`${origin}/join?error=need_invite`);
  }

  return NextResponse.redirect(`${origin}/`);
}
