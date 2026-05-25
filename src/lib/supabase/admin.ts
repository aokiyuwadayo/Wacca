import { createClient } from "@supabase/supabase-js";

/**
 * Service Role キーを使った管理クライアント。
 * **必ずサーバーサイドのみで使用**（Route Handler / Server Action）。
 *
 * 用途:
 * - 招待コード検証 + 新規 member 作成（RLS をバイパス）
 * - モデレーター操作（投稿の承認/却下/BAN）
 * - 匿名投稿の特定作業（規約 第 4 条に基づく重大事案のみ）
 *
 * 必要な環境変数:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY  ← ⚠ 絶対公開禁止
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
