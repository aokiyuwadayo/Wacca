"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { revokeInviteCode } from "../actions";

export function RevokeInviteButton({ code }: { code: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="flex flex-col items-end gap-1">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" disabled={pending}>
            無効化
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>招待コードを無効化</DialogTitle>
            <DialogDescription>
              <span className="font-mono font-medium">{code}</span>{" "}
              を即時失効させます。共有済みの招待 URL
              は使えなくなります。すでに加入したメンバーには影響しません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">やめる</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const res = await revokeInviteCode(code);
                  if (!res.ok) {
                    setError(res.error ?? "無効化に失敗しました。");
                    setOpen(false);
                    router.refresh();
                    return;
                  }
                  setOpen(false);
                  router.refresh();
                });
              }}
            >
              無効化する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
