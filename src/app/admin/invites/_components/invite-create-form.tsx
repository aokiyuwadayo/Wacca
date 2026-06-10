"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createInviteCode, type CreateInviteState } from "../actions";

const initialState: CreateInviteState = { ok: false };

export function InviteCreateForm() {
  const [state, formAction, pending] = useActionState(
    createInviteCode,
    initialState,
  );
  const [copied, setCopied] = useState(false);

  const inviteUrl =
    state.ok && state.code
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/join?code=${state.code}`
      : null;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="max_uses">使用回数の上限</Label>
          <Input
            id="max_uses"
            name="max_uses"
            type="number"
            min={1}
            max={100}
            defaultValue={1}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="expires_in_days">有効期間（日）</Label>
          <Input
            id="expires_in_days"
            name="expires_in_days"
            type="number"
            min={1}
            max={90}
            defaultValue={14}
            required
          />
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      {inviteUrl && (
        <div className="flex flex-col gap-2 rounded-md bg-brand-50 p-3">
          <p className="text-sm text-foreground">
            招待コード{" "}
            <span className="font-mono font-bold">{state.code}</span>{" "}
            を発行しました。
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded bg-background px-2 py-1 text-xs break-all">
              {inviteUrl}
            </code>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(inviteUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? "コピーしました" : "URL をコピー"}
            </Button>
          </div>
        </div>
      )}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "発行中..." : "招待コードを発行"}
        </Button>
      </div>
    </form>
  );
}
