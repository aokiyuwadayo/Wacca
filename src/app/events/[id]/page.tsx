import Link from "next/link";
import { notFound } from "next/navigation";
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
import { getEvent, formatEventDateTime } from "@/lib/events";
import { joinEvent, leaveEvent } from "@/app/events/actions";

export const metadata: Metadata = { title: "イベント詳細" };

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await getCurrentMember();
  const ev = await getEvent(id, member?.id ?? null);

  if (!ev) notFound();

  const statusLabel =
    ev.status === "cancelled"
      ? "中止"
      : ev.isPast
        ? "終了"
        : ev.status === "closed"
          ? "締切"
          : "募集中";

  const canJoin =
    !!member && ev.status === "open" && !ev.isPast && !ev.isFull && !ev.joinedByMe;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <Link href="/events" className="text-sm text-muted-foreground hover:underline">
        ← イベント掲示板に戻る
      </Link>

      <Card>
        <CardHeader>
          <CardDescription>
            📌 {formatEventDateTime(ev.starts_at)}
            {ev.location ? ` @ ${ev.location}` : ""} ・ {statusLabel}
          </CardDescription>
          <CardTitle className="text-xl">{ev.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          {ev.description && (
            <p className="whitespace-pre-wrap text-foreground">{ev.description}</p>
          )}

          <div className="text-muted-foreground">募集者: {ev.creatorName}</div>

          <div className="flex flex-col gap-1">
            <div className="font-medium text-foreground">
              行く: {ev.participantCount}
              {ev.capacity != null ? `/${ev.capacity}` : ""} 名
              {ev.isFull ? "（満員）" : ""}
            </div>
            {ev.participantNames.length > 0 && (
              <div className="text-muted-foreground">
                {ev.participantNames.join(", ")}
              </div>
            )}
          </div>

          {!member ? (
            <p className="text-muted-foreground">
              参加表明には{" "}
              <Link href="/join" className="text-brand-600 underline">
                サインアップ
              </Link>{" "}
              が必要です。
            </p>
          ) : ev.joinedByMe ? (
            <form action={leaveEvent.bind(null, ev.id)}>
              <Button type="submit" variant="outline">
                行くのをやめる
              </Button>
            </form>
          ) : canJoin ? (
            <form action={joinEvent.bind(null, ev.id)}>
              <Button type="submit">私も行く</Button>
            </form>
          ) : (
            <p className="text-muted-foreground">
              {ev.isFull ? "満員です。" : "現在は参加表明を受け付けていません。"}
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
