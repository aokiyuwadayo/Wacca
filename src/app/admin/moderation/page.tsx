import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { listPendingModerationPosts, requireModerator } from "@/lib/moderation";
import { ModerationActions } from "./_components/moderation-actions";

export const metadata = { title: "モデレーション" };

export default async function ModerationPage() {
  const moderator = await requireModerator();
  if (!moderator) redirect("/");

  const posts = await listPendingModerationPosts(moderator.organization_id);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-brand-600">
          モデレーションキュー
        </h1>
        <p className="text-sm text-muted-foreground">
          承認待ちの投稿 {posts.length} 件。投稿者は匿名ハッシュ先頭 4 文字のみ
          表示されます。
        </p>
        {moderator.role === "admin" && (
          <p className="text-sm">
            <Link
              href="/admin/invites"
              className="text-brand-600 hover:underline"
            >
              → 招待コード管理へ
            </Link>
          </p>
        )}
      </header>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            承認待ちの投稿はありません。
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {posts.map((post) => (
            <li key={post.id}>
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-600">
                      {post.categoryLabel}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      投稿者 {post.authorHashPrefix}
                    </span>
                    {!post.isAnonymous && (
                      <span className="text-xs text-amber-600">記名希望</span>
                    )}
                    {post.authorRejectedCount > 0 && (
                      <span className="inline-flex rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                        却下履歴 {post.authorRejectedCount} 件
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <p className="text-sm whitespace-pre-wrap text-foreground">
                    {post.body}
                  </p>
                  <time
                    dateTime={post.createdAt}
                    className="text-xs text-muted-foreground"
                  >
                    {new Date(post.createdAt).toLocaleString("ja-JP")}
                  </time>
                  <ModerationActions postId={post.id} />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
