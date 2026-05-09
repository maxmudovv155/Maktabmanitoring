import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export async function logActivity(
  supabase: SupabaseClient,
  args: {
    action: string;
    entity: string;
    entityId?: string | null;
    actorId?: string | null;
    details?: Database["public"]["Tables"]["activity_logs"]["Row"]["details"];
  },
) {
  const { error } = await supabase.from("activity_logs").insert({
    action: args.action,
    entity: args.entity,
    entity_id: args.entityId ?? null,
    actor_id: args.actorId ?? null,
    details: args.details ?? null,
  });
  return { error };
}
