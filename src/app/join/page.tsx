import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentMember } from "@/lib/member";
import { startGoogleSignIn } from "./actions";

export const metadata: Metadata = { title: "サインアップ" };

const ERROR_MESSAGES: Record<string, string> = {
  need_invite:
    "有効な招待コードが必要です。運営から受け取った招待リンクから開いてください。",
  auth: "サインインに失敗しました。もう一度お試しください。",
  missing_code: "認証コードが取得できませんでした。もう一度お試しください。",
};

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string }>;
}) {
  const { code, error } = await searchParams;

  // 既にメンバーならトップへ。
  const member = await getCurrentMember();
  if (member) redirect("/");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-brand-600">YUWA</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          サークルに参加する
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">招待コードでサインアップ</CardTitle>
          <CardDescription>
            運営から受け取った招待リンク（または招待コード）で参加できます。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && ERROR_MESSAGES[error] && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {ERROR_MESSAGES[error]}
            </p>
          )}

          <form action={startGoogleSignIn} className="flex flex-col gap-3">
            <input type="hidden" name="code" value={code ?? ""} />
            {code ? (
              <p className="text-sm text-muted-foreground">
                招待コード:{" "}
                <span className="font-mono font-medium text-foreground">
                  {code}
                </span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                招待リンクからではない場合、参加できないことがあります。
              </p>
            )}
            <Button type="submit">Google でサインイン</Button>
          </form>

          <p className="text-xs text-muted-foreground">
            すでに参加済みの場合も、同じボタンからログインできます。
          </p>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        <Link href="/" className="underline">
          トップに戻る
        </Link>
      </p>
    </main>
  );
}
