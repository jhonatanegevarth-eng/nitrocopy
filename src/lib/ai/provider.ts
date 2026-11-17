import type { Provider } from "./models";

export function getProvider(override?: string | null): Provider {
  const p = (override ?? process.env.AI_PROVIDER ?? "openai").toLowerCase();
  return p === "venice" ? "venice" : "openai";
}

export function getBaseURL(provider: Provider): string {
  return provider === "venice"
    ? "https://api.venice.ai/api/v1"
    : "https://api.openai.com/v1";
}
