import { createClient } from "@/lib/supabase/server";
import type { TrainingEntry, ToolType } from "../types";

export interface ITrainingRepo {
  list(userId: string, tool: ToolType, limit?: number): Promise<TrainingEntry[]>;
  listExcludingLabel(userId: string, tool: ToolType, excludeLabel: string, limit?: number): Promise<TrainingEntry[]>;
  insert(userId: string, tool: ToolType, content: string, label?: string): Promise<void>;
  deleteByLabel(userId: string, tool: ToolType, label: string): Promise<void>;
}

export async function getTrainingRepo(): Promise<ITrainingRepo> {
  const supabase = await createClient();
  return {
    async list(userId, tool, limit = 15) {
      const { data } = await supabase
        .from("training_entries")
        .select("content, label, created_at")
        .eq("user_id", userId)
        .eq("tool", tool)
        .order("created_at", { ascending: false })
        .limit(limit);
      return data ?? [];
    },
    async listExcludingLabel(userId, tool, excludeLabel, limit = 30) {
      const { data } = await supabase
        .from("training_entries")
        .select("content, label, created_at")
        .eq("user_id", userId)
        .eq("tool", tool)
        .neq("label", excludeLabel)
        .order("created_at", { ascending: false })
        .limit(limit);
      return data ?? [];
    },
    async insert(userId, tool, content, label) {
      await supabase.from("training_entries").insert({
        user_id: userId,
        tool,
        content,
        ...(label !== undefined ? { label } : {}),
      });
    },
    async deleteByLabel(userId, tool, label) {
      await supabase
        .from("training_entries")
        .delete()
        .eq("user_id", userId)
        .eq("tool", tool)
        .eq("label", label);
    },
  };
}
