import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/member";
import { PostForm } from "../_components/post-form";

export const metadata = { title: "意見を投稿" };

export default async function NewPostPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/");

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <Link
          href="/posts"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← みんなの声へ戻る
        </Link>
        <h1 className="text-2xl font-bold text-brand-600">意見を投稿</h1>
        <p className="text-sm text-muted-foreground">
          投稿は運営の承認後に公開されます。匿名投稿では、運営にもあなたの名前は
          表示されません。
        </p>
      </header>

      <PostForm />
    </main>
  );
}
