"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createEvent, type CreateEventState } from "@/app/events/actions";

const initialState: CreateEventState = { ok: false };

export function EventForm() {
  const [state, formAction, pending] = useActionState(
    createEvent,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
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
        <Input id="starts_at" name="starts_at" type="datetime-local" required />
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

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "作成中..." : "募集を作成"}
        </Button>
        <Button asChild variant="outline" type="button">
          <Link href="/events">キャンセル</Link>
        </Button>
      </div>
    </form>
  );
}
