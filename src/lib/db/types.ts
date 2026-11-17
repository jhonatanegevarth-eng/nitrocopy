export interface AuthUser {
  id: string;
  email?: string;
}

export type ToolType = "native" | "ads" | "vsl";

export interface UserSettings {
  openai_api_key: string | null;
  ai_provider: string;
  venice_balance_usd: number | null;
}

export interface TrainingEntry {
  content: string;
  label: string | null;
  created_at?: string;
}

export interface GenerationRecord {
  tool: ToolType;
  mode?: string;
  input: object;
  output: object;
}
