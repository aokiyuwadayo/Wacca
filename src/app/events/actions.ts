"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/member";

export interface CreateEventState {
  ok: boolean;
  error?: string;
}

export interface EventParticipationResult {
  ok: boolean;
  error?: string;
}

/** イベント募集を作成する。記名（created_by = 自分）のみ。 */
export async function createEvent(
  _prev: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  const member = await getCurrentMember();
  if (!member) redirect("/join");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const startsAt = String(formData.get("starts_at") ?? "");
  const location = String(formData.get("location") ?? "").trim();
  const capacityRaw = String(formData.get("capacity") ?? "").trim();
  const capacity = capacityRaw ? Number(capacityRaw) : null;

  if (!title || !startsAt) {
    return { ok: false, error: "タイトルと日時は必須です。" };
  }
  const startsAtDate = new Date(`${startsAt}:00+09:00`);
  if (Number.isNaN(startsAtDate.getTime())) {
    return { ok: false, error: "日時を正しく入力してください。" };
  }
  if (startsAtDate.getTime() <= Date.now()) {
    return { ok: false, error: "未来の日時を入力してください。" };
  }
  if (capacity != null && (!Number.isInteger(capacity) || capacity < 1)) {
    return {
      ok: false,
      error: "定員は 1 以上の整数で入力してください。",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .insert({
      organization_id: member.organization_id,
      created_by: member.id,
      title,
      description,
      // datetime-local は TZ 情報を持たない。サークルは JST 運用なので
      // 入力の壁時計時刻を JST(+09:00) として解釈し、UTC で保存する
      // （サーバ TZ で解釈されて 9 時間ずれるのを防ぐ）。
      starts_at: startsAtDate.toISOString(),
      location,
      capacity,
    })
    .select("id")
    .single();

  if (error) {
    return {
      ok: false,
      error: "イベントの作成に失敗しました。時間をおいて再度お試しください。",
    };
  }

  revalidatePath("/events");
  redirect(`/events/${data.id}`);
}

/** 「私も行く」: 自分の参加表明を追加。満員・締切等は DB trigger が弾く。 */
export async function joinEvent(
  eventId: string,
): Promise<EventParticipationResult> {
  const member = await getCurrentMember();
  if (!member) redirect("/join");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("event_participants")
    .insert({ event_id: eventId, member_id: member.id });

  if (error) {
    return {
      ok: false,
      error: "参加表明に失敗しました。満員または受付終了の可能性があります。",
    };
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  return { ok: true };
}

/** 「行くのをやめる」: 自分の参加表明を取り消す。 */
export async function leaveEvent(
  eventId: string,
): Promise<EventParticipationResult> {
  const member = await getCurrentMember();
  if (!member) redirect("/join");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("event_participants")
    .delete()
    .eq("event_id", eventId)
    .eq("member_id", member.id);

  if (error) {
    return {
      ok: false,
      error: "参加表明の取り消しに失敗しました。時間をおいて再度お試しください。",
    };
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  return { ok: true };
}
