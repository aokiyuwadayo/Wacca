import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentMember } from "@/lib/member";
import { createEvent } from "@/app/events/actions";

export const metadata: Metadata = { title: "イベントを追加" };

export default async function NewEventPage() {
  const member = await getCurrentMember();

  if (!member) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-12">
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            イベントの募集には{" "}
            <Link href="/join" className="text-brand-600 underline">
              招待コードでサインアップ
            </Link>{" "}
            が必要です。
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="font-display text-2xl font-bold text-brand-600">
        イベントを追加
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            一緒に行く仲間を募集する
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createEvent} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">タイトル *</Label>
              <Input
                id="title"
                name="title"
                required
                maxLength={120}
                placeholder="例: Startup Pitch Battle 2026"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="starts_at">日時 *</Label>
              <Input
                id="starts_at"
                name="starts_at"
                type="datetime-local"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="location">場所</Label>
              <Input
                id="location"
                name="location"
                maxLength={200}
                placeholder="例: 渋谷 / オンライン"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="capacity">定員（任意・空欄で無制限）</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min={1}
                placeholder="例: 5"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                name="description"
                rows={4}
                maxLength={4000}
                placeholder="どんなイベント？ 参加費・主催など"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit">募集を作成</Button>
              <Button asChild variant="outline" type="button">
                <Link href="/events">キャンセル</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
