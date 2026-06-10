import Link from "next/link";
import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentMember } from "@/lib/member";
import { EventForm } from "./_components/event-form";

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
          <EventForm />
        </CardContent>
      </Card>
    </main>
  );
}
