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
import {
  markMemberLeft,
  reactivateMember,
  type MemberStatusResult,
} from "../actions";

export function MemberRowActions({
  memberId,
  displayName,
  status,
  isSelf,
}: {
  memberId: string;
  displayName: string;
  status: "active" | "suspended" | "left";
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const router = useRouter();

  function run(action: () => Promise<MemberStatusResult>) {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (!res.ok) {
        setError(res.error ?? "操作に失敗しました。");
      }
      setLeaveOpen(false);
      router.refresh();
    });
  }

  if (isSelf) {
    return <span className="text-xs text-muted-foreground">あなた</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {status === "active" && (
        <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" disabled={pending}>
              脱退処理
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>メンバーを脱退処理</DialogTitle>
              <DialogDescription>
                <span className="font-medium">{displayName}</span>{" "}
                さんを脱退済みにします。本人はアプリにアクセスできなくなりますが、
                過去の投稿やリアクションはそのまま残ります。あとから「復帰」で
                取り消せます。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">やめる</Button>
              </DialogClose>
              <Button
                variant="destructive"
                disabled={pending}
                onClick={() => run(() => markMemberLeft(memberId))}
              >
                脱退処理する
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {status === "left" && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run(() => reactivateMember(memberId))}
        >
          復帰
        </Button>
      )}

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
