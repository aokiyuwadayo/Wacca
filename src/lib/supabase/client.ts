import { createBrowserClient } from "@supabase/ssr";

/**
 * ブラウザ環境用の Supabase クライアント。
 * Client Component や useEffect 等で使う。
 *
 * 必要な環境変数:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
