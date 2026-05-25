/**
 * 運営 UI 用に、匿名ハッシュの先頭 4 文字だけを返す。
 * 例: "a3f9c4d2..." → "a3f9…"
 *
 * 規約 第 4 条の「通常運用では運営も投稿者を特定できない」を実装上で担保するため、
 * モデレーションキュー画面でも先頭 4 文字のみを表示する。
 *
 * 匿名ハッシュの生成は DB 関数 `generate_member_anonymous_hash` に集約する。
 */
export function shortenHash(hash: string, length: number = 4): string {
  return `${hash.slice(0, length)}…`;
}
