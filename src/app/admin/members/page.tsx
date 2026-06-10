import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/invites";
import { listMembers, type MemberStatus } from "@/lib/members-admin";
import { MemberRowActions } from "./_components/member-row-actions";

export const metadata = { title: "メンバー名簿" };

const ROLE_LABELS: Record<string, string> = {
  admin: "管理者",
  moderator: "モデレーター",
  member: "メンバー",
};

const STATUS_LABELS: Record<MemberStatus, string> = {
  active: "在籍",
  suspended: "停止中",
  left: "脱退済み",
};

const STATUS_BADGE_CLASSES: Record<MemberStatus, string> = {
  active: "bg-teal-50 text-teal-700",
  suspended: "bg-amber-50 text-amber-700",
  left: "bg-muted text-muted-foreground",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(d);
}

export default async function MembersPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  const members = await listMembers(admin.organization_id);
  const activeCount = members.filter((m) => m.status === "active").length;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-brand-600">メンバー名簿</h1>
        <p className="text-sm text-muted-foreground">
          在籍 {activeCount} 名 / 全 {members.length} 名。脱退処理すると本人は
          アクセスできなくなりますが、投稿は残ります。
        </p>
        <p className="flex gap-4 text-sm">
          <Link
            href="/admin/invites"
            className="text-brand-600 hover:underline"
          >
            → 招待コード管理へ
          </Link>
          <Link
            href="/admin/moderation"
            className="text-brand-600 hover:underline"
          >
            → モデレーションキューへ
          </Link>
        </p>
      </header>

      {members.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            メンバーがいません。
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {members.map((m) => (
            <li key={m.id}>
              <Card>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{m.displayName}</span>
                      <span className="text-xs text-muted-foreground">
                        {ROLE_LABELS[m.role] ?? m.role}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[m.status]}`}
                      >
                        {STATUS_LABELS[m.status]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(m.joinedAt)} 加入
                      {m.inviteCode && (
                        <>
                          {" ・ 招待コード "}
                          <span className="font-mono">{m.inviteCode}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <MemberRowActions
                    memberId={m.id}
                    displayName={m.displayName}
                    status={m.status}
                    isSelf={m.id === admin.id}
                  />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
