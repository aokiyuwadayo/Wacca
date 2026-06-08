"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/post-categories";
import { createPost, type CreatePostState } from "../actions";

const initialState: CreatePostState = { ok: false };

export function PostForm() {
  const [state, formAction, pending] = useActionState(createPost, initialState);

  if (state.ok) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-brand-600/30 bg-brand-50 p-6 text-center">
        <p className="text-base font-medium text-brand-600">
          送信しました 🙌
        </p>
        <p className="text-sm text-muted-foreground">
          運営の承認後に公開されます。承認まで少しお待ちください。
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/posts">みんなの声を見る</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/posts/new">続けて投稿する</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">カテゴリ</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_ORDER.map((category, index) => (
            <label
              key={category}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors",
                "has-[:checked]:border-brand-600 has-[:checked]:bg-brand-600 has-[:checked]:text-white",
                "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              <input
                type="radio"
                name="category"
                value={category}
                defaultChecked={index === 0}
                className="sr-only"
              />
              {CATEGORY_LABELS[category]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="body">本文</Label>
        <Textarea
          id="body"
          name="body"
          required
          rows={6}
          maxLength={4000}
          placeholder="改善要望やアイデアを自由に書いてください。"
        />
        <p className="text-xs text-muted-foreground">
          4000 文字まで。誹謗中傷や個人を特定する内容は承認されません。
        </p>
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          name="named"
          className="mt-0.5 size-4 rounded border-border"
        />
        <span className="text-muted-foreground">
          記名で投稿する（運営に表示名が伝わります。チェックしない場合は匿名）
        </span>
      </label>

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "送信中…" : "投稿する"}
        </Button>
        <Button asChild variant="ghost">
          <Link href="/posts">キャンセル</Link>
        </Button>
      </div>
    </form>
  );
}
