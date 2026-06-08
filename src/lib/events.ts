import { createSupabaseServerClient } from "@/lib/supabase/server";

// PostgREST のネスト埋め込みは未検証で壊れやすいため、素直なクエリ＋JS 結合で組む。
// RLS により events / event_participants / members はいずれも自 organization に絞られる。

export interface EventRow {
  id: string;
  organization_id: string;
  created_by: string;
  title: string;
  description: string;
  starts_at: string;
  location: string;
  capacity: number | null;
  status: "open" | "closed" | "cancelled";
  created_at: string;
}

export interface EventView extends EventRow {
  creatorName: string;
  participantNames: string[];
  participantCount: number;
  joinedByMe: boolean;
  isFull: boolean;
  isPast: boolean;
}

interface ParticipantRow {
  event_id: string;
  member_id: string;
}

function decorate(
  ev: EventRow,
  participants: ParticipantRow[],
  nameById: Map<string, string>,
  currentMemberId: string | null,
  now: number,
): EventView {
  const ps = participants.filter((p) => p.event_id === ev.id);
  return {
    ...ev,
    creatorName: nameById.get(ev.created_by) ?? "（不明）",
    participantNames: ps.map((p) => nameById.get(p.member_id) ?? "（不明）"),
    participantCount: ps.length,
    joinedByMe: currentMemberId
      ? ps.some((p) => p.member_id === currentMemberId)
      : false,
    isFull: ev.capacity != null && ps.length >= ev.capacity,
    isPast: new Date(ev.starts_at).getTime() < now,
  };
}

async function loadNamesAndParticipants(events: EventRow[]) {
  const supabase = await createSupabaseServerClient();
  const eventIds = events.map((e) => e.id);

  const { data: participants } = await supabase
    .from("event_participants")
    .select("event_id, member_id")
    .in("event_id", eventIds);
  const ps = (participants ?? []) as ParticipantRow[];

  const memberIds = [
    ...new Set([
      ...events.map((e) => e.created_by),
      ...ps.map((p) => p.member_id),
    ]),
  ];
  const { data: members } = await supabase
    .from("members")
    .select("id, display_name")
    .in("id", memberIds);

  const nameById = new Map<string, string>(
    ((members ?? []) as { id: string; display_name: string }[]).map((m) => [
      m.id,
      m.display_name,
    ]),
  );
  return { ps, nameById };
}

const EVENT_COLUMNS =
  "id, organization_id, created_by, title, description, starts_at, location, capacity, status, created_at";

/**
 * "6/15 (土) 13:00" 形式。**必ず JST(Asia/Tokyo)で表示**する。
 * サーバ(Vercel)が UTC でも、サーバ側 getHours() に依存せず正しく JST 表示するため
 * Intl + timeZone を使う（サーバ TZ 依存で時刻がずれるのを防ぐ）。
 */
export function formatEventDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      month: "numeric",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.month}/${parts.day} (${parts.weekday}) ${parts.hour}:${parts.minute}`;
}

export async function listEvents(
  currentMemberId: string | null,
): Promise<EventView[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .order("starts_at", { ascending: true });

  const events = (data ?? []) as EventRow[];
  if (events.length === 0) return [];

  const { ps, nameById } = await loadNamesAndParticipants(events);
  const now = Date.now();
  return events.map((ev) => decorate(ev, ps, nameById, currentMemberId, now));
}

export async function getEvent(
  id: string,
  currentMemberId: string | null,
): Promise<EventView | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  const event = data as EventRow;

  const { ps, nameById } = await loadNamesAndParticipants([event]);
  return decorate(event, ps, nameById, currentMemberId, Date.now());
}
