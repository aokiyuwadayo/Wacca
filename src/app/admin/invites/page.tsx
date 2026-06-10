import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  listInviteCodes,
  requireAdmin,
  type InviteCodeStatus,
} from "@/lib/invites";
import { InviteCreateForm } from "./_components/invite-create-form";
import { RevokeInviteButton } from "./_components/revoke-invite-button";

export const metadata = { title: "招待コード管理" };

const STATUS_LABELS: Record<InviteCodeStatus, string> = {
  active: "有効",
  exhausted: "使い切り",
  expired: "期限切れ",
};

const STATUS_BADGE_CLASSES: Record<InviteCodeStatus, string> = {
  active: "bg-teal-50 text-teal-700",
  exhausted: "bg-muted text-muted-foreground",
  expired: "bg-destructive/10 text-destructive",
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export default async function InvitesPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  const codes = await listInviteCodes(admin.organization_id);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-brand-600">招待コード管理</h1>
        <p className="text-sm text-muted-foreground">
          招待コードの発行・無効化と、誰がどのコードで加入したかを確認できます。
        </p>
        <p className="text-sm">
          <Link
            href="/admin/moderation"
            className="text-brand-600 hover:underline"
          >
            → モデレーションキューへ
          </Link>
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">新しい招待コードを発行</CardTitle>
          <CardDescription>
            発行した招待 URL を Slack / LINE などで共有してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteCreateForm />
        </CardContent>
      </Card>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">発行済みコード {codes.length} 件</h2>

        {codes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              まだ招待コードがありません。
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-4">
            {codes.map((c) => (
              <li key={c.code}>
                <Card>
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-base font-bold">
                          {c.code}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[c.status]}`}
                        >
                          {STATUS_LABELS[c.status]}
                        </span>
                      </div>
                      {c.status === "active" && (
                        <RevokeInviteButton code={c.code} />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 text-sm">
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
                      <div>
                        <dt className="text-xs text-muted-foreground">使用</dt>
                        <dd>
                          {c.usedCount} / {c.maxUses}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">期限</dt>
                        <dd>{formatDateTime(c.expiresAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">発行者</dt>
                        <dd>{c.issuedByName ?? "—"}</dd>
                      </div>
                    </dl>

                    {c.joinedMembers.length > 0 && (
                      <div className="flex flex-col gap-1 border-t pt-2">
                        <p className="text-xs text-muted-foreground">
                          このコードで加入したメンバー
                        </p>
                        <ul className="flex flex-col gap-0.5">
                          {c.joinedMembers.map((m, i) => (
                            <li key={`${c.code}-${i}`}>
                              {m.displayName}
                              <span className="ml-2 text-xs text-muted-foreground">
                                {formatDateTime(m.joinedAt)} 加入
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
