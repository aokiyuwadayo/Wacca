import Link from "next/link";
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
import { listEvents, formatEventDateTime, type EventView } from "@/lib/events";

export const metadata: Metadata = { title: "イベント掲示板" };

function CapacityLabel({ ev }: { ev: EventView }) {
  const base = `🙋 ${ev.participantCount}${ev.capacity != null ? `/${ev.capacity}` : ""} 名`;
  return (
    <span className={ev.isFull ? "text-muted-foreground" : "text-brand-600"}>
      {base}
      {ev.isFull ? "（満員）" : ""}
    </span>
  );
}

function EventCard({ ev }: { ev: EventView }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>
          📌 {formatEventDateTime(ev.starts_at)}
          {ev.location ? ` @ ${ev.location}` : ""}
        </CardDescription>
        <CardTitle>
          <Link href={`/events/${ev.id}`} className="hover:underline">
            {ev.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
        <div>募集者: {ev.creatorName}</div>
        <div className="flex flex-wrap items-center gap-2">
          <CapacityLabel ev={ev} />
          {ev.participantNames.length > 0 && (
            <span>（{ev.participantNames.join(", ")}）</span>
          )}
        </div>
        <div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/events/${ev.id}`}>
              {ev.joinedByMe ? "参加状況を見る" : "詳細・私も行く"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function EventsPage() {
  const member = await getCurrentMember();
  const events = await listEvents(member?.id ?? null);

  const open = events.filter((e) => e.status === "open" && !e.isPast);
  const finished = events.filter((e) => e.status !== "open" || e.isPast);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-brand-600">
          📅 イベント掲示板
        </h1>
        <Button asChild>
          <Link href="/events/new">イベントを追加</Link>
        </Button>
      </div>

      {!member && (
        <Card>
          <CardContent className="py-4 text-sm text-muted-foreground">
            イベントの募集・参加には{" "}
            <Link href="/join" className="text-brand-600 underline">
              招待コードでサインアップ
            </Link>{" "}
            が必要です。
          </CardContent>
        </Card>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">募集中</h2>
        {open.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            募集中のイベントはまだありません。
          </p>
        ) : (
          open.map((ev) => <EventCard key={ev.id} ev={ev} />)
        )}
      </section>

      {finished.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            終了済み
          </h2>
          {finished.map((ev) => (
            <EventCard key={ev.id} ev={ev} />
          ))}
        </section>
      )}
    </main>
  );
}
