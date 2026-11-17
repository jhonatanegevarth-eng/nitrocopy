import { createClient } from "@/lib/supabase/server";
import type { GenerationRecord } from "../types";

export interface IGenerationsRepo {
  insert(userId: string, record: GenerationRecord): Promise<void>;
}

export async function getGenerationsRepo(): Promise<IGenerationsRepo> {
  const supabase = await createClient();
  return {
    async insert(userId, record) {
      await supabase.from("generations").insert({
        user_id: userId,
        ...record,
      });
    },
  };
}
