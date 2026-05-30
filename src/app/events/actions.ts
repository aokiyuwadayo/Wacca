"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/member";

/** イベント募集を作成する。記名（created_by = 自分）のみ。 */
export async function createEvent(formData: FormData) {
  const member = await getCurrentMember();
  if (!member) redirect("/join");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const startsAt = String(formData.get("starts_at") ?? "");
  const location = String(formData.get("location") ?? "").trim();
  const capacityRaw = String(formData.get("capacity") ?? "").trim();
  const capacity = capacityRaw ? Number(capacityRaw) : null;

  if (!title || !startsAt) {
    throw new Error("タイトルと日時は必須です");
  }
  if (capacity != null && (!Number.isInteger(capacity) || capacity < 1)) {
    throw new Error("定員は 1 以上の整数で入力してください");
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
      starts_at: new Date(`${startsAt}:00+09:00`).toISOString(),
      location,
      capacity,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/events");
  redirect(`/events/${data.id}`);
}

/** 「私も行く」: 自分の参加表明を追加。満員・締切等は DB trigger が弾く。 */
export async function joinEvent(eventId: string) {
  const member = await getCurrentMember();
  if (!member) redirect("/join");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("event_participants")
    .insert({ event_id: eventId, member_id: member.id });

  if (error) throw new Error(error.message);

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
}

/** 「行くのをやめる」: 自分の参加表明を取り消す。 */
export async function leaveEvent(eventId: string) {
  const member = await getCurrentMember();
  if (!member) redirect("/join");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("event_participants")
    .delete()
    .eq("event_id", eventId)
    .eq("member_id", member.id);

  if (error) throw new Error(error.message);

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
}
