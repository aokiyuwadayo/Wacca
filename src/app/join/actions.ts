"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { INVITE_COOKIE } from "@/lib/signup";

/**
 * 招待コードを cookie に保持してから Google OAuth を開始する。
 * OAuth 後は /auth/callback に戻り、そこで member を作成する。
 */
export async function startGoogleSignIn(formData: FormData) {
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();

  const cookieStore = await cookies();
  if (code) {
    cookieStore.set(INVITE_COOKIE, code, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 600,
    });
  }

  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : "";

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error || !data?.url) {
    throw new Error(error?.message ?? "Google サインインの開始に失敗しました");
  }

  redirect(data.url);
}
