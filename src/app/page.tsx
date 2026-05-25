import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <section className="flex w-full max-w-3xl flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <h1 className="font-display text-5xl font-extrabold tracking-wide text-brand-600 sm:text-6xl">
            YUWA
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            サークル運営を、もっと温かく。
          </p>
        </div>

        <p className="max-w-xl text-base text-foreground sm:text-lg">
          YUWA は、サークルメンバーが
          <strong className="text-brand-600">言いづらいことを安全に言える</strong>
          、そして
          <strong className="text-brand-600">気軽に集まれる</strong>
          場をつくる Web アプリです。
        </p>

        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>🗣️ 匿名意見箱</CardTitle>
              <CardDescription>
                改善要望・アイデアを匿名で投稿。運営の承認後に公開されます。
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              ハッシュ化匿名 + モデレーションキュー方式で、安心して声を届けられます。
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📅 イベント掲示板</CardTitle>
              <CardDescription>
                外部イベントへの同行者を募集できる場。
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              「私も行く」のひと押しで、一人で行きづらいイベントも仲間と一緒に。
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/join">招待コードでサインアップ</Link>
          </Button>
          <Button asChild variant="outline">
            <a
              href="https://github.com/aokiyuwadayo/yuwa"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub で詳しく見る
            </a>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          YUWA は現在 Phase 1（環境構築）の途中です。
        </p>
      </section>
    </main>
  );
}
