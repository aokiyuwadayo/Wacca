"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  joinEvent,
  leaveEvent,
  type EventParticipationResult,
} from "@/app/events/actions";

export function ParticipationActions({
  eventId,
  joinedByMe,
  canJoin,
  isFull,
}: {
  eventId: string;
  joinedByMe: boolean;
  canJoin: boolean;
  isFull: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function run(action: () => Promise<EventParticipationResult>) {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (!res.ok) {
        setError(res.error ?? "操作に失敗しました。");
        router.refresh();
        return;
      }
      router.refresh();
    });
  }

  if (joinedByMe) {
    return (
      <div className="flex flex-col items-start gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => run(() => leaveEvent(eventId))}
        >
          {pending ? "更新中..." : "行くのをやめる"}
        </Button>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (canJoin) {
    return (
      <div className="flex flex-col items-start gap-2">
        <Button
          type="button"
          disabled={pending}
          onClick={() => run(() => joinEvent(eventId))}
        >
          {pending ? "更新中..." : "私も行く"}
        </Button>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <p className="text-muted-foreground">
      {isFull ? "満員です。" : "現在は参加表明を受け付けていません。"}
    </p>
  );
}
