import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getCurrentMember } from "@/lib/member";
import { listApprovedPosts, isPostCategory } from "@/lib/posts";
import { CategoryFilter } from "./_components/category-filter";
import { ReactionButton } from "./_components/reaction-button";

export const metadata = { title: "みんなの声" };

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const member = await getCurrentMember();
  if (!member) redirect("/");

  const { category: categoryParam } = await searchParams;
  const category = isPostCategory(categoryParam) ? categoryParam : undefined;

  const posts = await listApprovedPosts(category);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-brand-600">みんなの声</h1>
          <Button asChild size="sm">
            <Link href="/posts/new">意見を投稿</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          運営が承認した投稿が表示されます。気になる声には 🫶 で応援できます。
        </p>
      </header>

      <CategoryFilter active={category} />

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            まだ公開された投稿はありません。
            <br />
            最初の声を届けてみませんか？
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {posts.map((post) => (
            <li key={post.id}>
              <Card>
                <CardHeader>
                  <span className="inline-flex w-fit rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-600">
                    {post.categoryLabel}
                  </span>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <p className="text-sm whitespace-pre-wrap text-foreground">
                    {post.body}
                  </p>
                  <div className="flex items-center justify-between">
                    <time
                      dateTime={post.created_at}
                      className="text-xs text-muted-foreground"
                    >
                      {new Date(post.created_at).toLocaleDateString("ja-JP")}
                    </time>
                    <ReactionButton
                      postId={post.id}
                      initialCount={post.reactionCount}
                      initialReacted={post.reactedByMe}
                    />
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
