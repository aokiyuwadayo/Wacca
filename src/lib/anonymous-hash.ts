import { createHash } from "node:crypto";

/**
 * メンバー ID と organization の salt から匿名ハッシュを生成する。
 *
 * 設計: docs/requirements-v0.1.md §7 匿名性の仕様
 *
 * - 同じメンバーは常に同じハッシュ → 同一投稿者の連続違反を識別可能
 * - 異なるメンバーは異なるハッシュ → 別人と区別可能
 * - 運営にも投稿者の生 ID は公開されない（DB レベルでもアプリ層でも非開示）
 *
 * @param memberId Supabase auth.users.id
 * @param orgSalt organizations.anonymity_salt
 * @returns 64 桁の hex 文字列
 */
export function deriveAnonymousHash(memberId: string, orgSalt: string): string {
  if (!memberId || !orgSalt) {
    throw new Error("deriveAnonymousHash: memberId and orgSalt are required");
  }
  return createHash("sha256")
    .update(`${memberId}:${orgSalt}`)
    .digest("hex");
}

/**
 * 運営 UI 用に、匿名ハッシュの先頭 4 文字だけを返す。
 * 例: "a3f9c4d2..." → "a3f9…"
 *
 * 規約 第 4 条の「通常運用では運営も投稿者を特定できない」を実装上で担保するため、
 * モデレーションキュー画面でも先頭 4 文字のみを表示する。
 */
export function shortenHash(hash: string, length: number = 4): string {
  return `${hash.slice(0, length)}…`;
}
