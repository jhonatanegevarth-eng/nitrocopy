export type Provider = "openai" | "venice";

export const MODELS: Record<Provider, { text: string; image: string; vision: string }> = {
  openai: {
    text: "gpt-4o",
    image: "dall-e-3",
    vision: "gpt-4o",
  },
  venice: {
    text: "llama-3.3-70b",
    image: "fluently-xl",
    vision: "qwen3-vl-235b-a22b",
  },
};
