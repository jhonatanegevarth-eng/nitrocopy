import { createClient } from "@/lib/supabase/server";
import type { UserSettings } from "../types";

export interface ISettingsRepo {
  get(userId: string): Promise<UserSettings | null>;
  upsert(userId: string, data: Partial<UserSettings> & { updated_at?: string }): Promise<void>;
  updateBalance(userId: string, balance: number): Promise<void>;
}

export async function getSettingsRepo(): Promise<ISettingsRepo> {
  const supabase = await createClient();
  return {
    async get(userId) {
      const { data } = await supabase
        .from("user_settings")
        .select("openai_api_key, ai_provider, venice_balance_usd")
        .eq("user_id", userId)
        .single();
      return data ?? null;
    },
    async upsert(userId, data) {
      await supabase
        .from("user_settings")
        .upsert({ user_id: userId, ...data }, { onConflict: "user_id" });
    },
    async updateBalance(userId, balance) {
      await supabase
        .from("user_settings")
        .update({ venice_balance_usd: balance })
        .eq("user_id", userId);
    },
  };
}
