"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  approvePost,
  banPostAuthor,
  rejectPost,
  type ModerationResult,
} from "../actions";

export function ModerationActions({ postId }: { postId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [banReason, setBanReason] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [banOpen, setBanOpen] = useState(false);
  const router = useRouter();

  function run(
    action: () => Promise<ModerationResult>,
    onSuccess?: () => void,
  ) {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (!res.ok) {
        setError(res.error ?? "操作に失敗しました。");
        return;
      }
      onSuccess?.();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={pending}
          onClick={() => run(() => approvePost(postId))}
        >
          承認
        </Button>

        {/* 却下（理由は任意） */}
        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" disabled={pending}>
              却下
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>投稿を却下</DialogTitle>
              <DialogDescription>
                却下理由はログに記録されます（任意）。投稿は非公開のままです。
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`reject-reason-${postId}`}>理由（任意）</Label>
              <Textarea
                id={`reject-reason-${postId}`}
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="例: 個人を特定する内容のため"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">やめる</Button>
              </DialogClose>
              <Button
                variant="outline"
                disabled={pending}
                onClick={() =>
                  run(
                    () => rejectPost(postId, rejectReason),
                    () => {
                      setRejectReason("");
                      setRejectOpen(false);
                    },
                  )
                }
              >
                却下する
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* BAN（投稿者の匿名ハッシュをブロック） */}
        <Dialog open={banOpen} onOpenChange={setBanOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="destructive" disabled={pending}>
              BAN
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>投稿者を BAN</DialogTitle>
              <DialogDescription>
                この投稿者の匿名ハッシュをブロックし、以降の投稿を受け付けなく
                します。この投稿と同一投稿者の承認待ち投稿もまとめて却下されます。
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`ban-reason-${postId}`}>理由（任意）</Label>
              <Textarea
                id={`ban-reason-${postId}`}
                rows={3}
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="例: 繰り返しの規約違反"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">やめる</Button>
              </DialogClose>
              <Button
                variant="destructive"
                disabled={pending}
                onClick={() =>
                  run(
                    () => banPostAuthor(postId, banReason),
                    () => {
                      setBanReason("");
                      setBanOpen(false);
                    },
                  )
                }
              >
                BAN する
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
