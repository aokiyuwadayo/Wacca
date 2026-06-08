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

  const h = await headers();
  const host = h.get("host");
  const isLocal =
    !!host && (host.startsWith("localhost") || host.startsWith("127.0.0.1"));

  const cookieStore = await cookies();
  if (code) {
    cookieStore.set(INVITE_COOKIE, code, {
      httpOnly: true,
      sameSite: "lax",
      // localhost(http) では secure cookie が送信されず招待が消えるため、本番のみ secure。
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 600,
    });
  }

  // localhost では x-forwarded-proto が無く、https 既定だと OAuth リダイレクトが壊れる。
  // 本番ドメインを固定したい場合は NEXT_PUBLIC_SITE_URL を優先。
  const proto = h.get("x-forwarded-proto") ?? (isLocal ? "http" : "https");
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? (host ? `${proto}://${host}` : "");

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
