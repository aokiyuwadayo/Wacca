"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { toggleReaction } from "../actions";

/**
 * 🫶 リアクションのトグルボタン。optimistic update で即座に反映し、
 * サーバ側が失敗したらロールバックする。
 */
export function ReactionButton({
  postId,
  initialCount,
  initialReacted,
}: {
  postId: string;
  initialCount: number;
  initialReacted: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [reacted, setReacted] = useState(initialReacted);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const next = !reacted;
    // optimistic
    setReacted(next);
    setCount((c) => c + (next ? 1 : -1));

    startTransition(async () => {
      const res = await toggleReaction(postId);
      if (!res.ok) {
        // rollback
        setReacted(!next);
        setCount((c) => c + (next ? -1 : 1));
        return;
      }
      setReacted(res.reacted);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={reacted}
      aria-label={reacted ? "リアクションを取り消す" : "リアクションする"}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors disabled:opacity-60",
        reacted
          ? "border-brand-600 bg-brand-50 text-brand-600"
          : "border-border text-muted-foreground hover:bg-muted",
      )}
    >
      <span aria-hidden>🫶</span>
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
