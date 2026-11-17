import OpenAI from "openai";
import { getProvider } from "./provider";
import { MODELS } from "./models";

export async function generateImage(
  prompt: string,
  apiKey: string,
  providerOverride?: string | null
): Promise<string | null> {
  const provider = getProvider(providerOverride);

  if (provider === "openai") {
    const client = new OpenAI({ apiKey });
    const res = await client.images.generate({
      model: MODELS.openai.image,
      prompt,
      size: "1792x1024",
      quality: "standard",
      n: 1,
    });
    return res.data?.[0]?.url ?? null;
  }

  // Venice: direct fetch to capture headers and use own params
  const res = await fetch("https://api.venice.ai/api/v1/image/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODELS.venice.image,
      prompt,
      aspect_ratio: "3:2",
      width: 1280,
      height: 853,
      format: "webp",
      hide_watermark: true,
    }),
  });

  if (!res.ok) throw new Error(`Venice image error: ${res.status}`);

  const data = await res.json();
  const img = data.images?.[0];
  if (!img) return null;
  if (typeof img === "string") return `data:image/webp;base64,${img}`;
  if (img.url) return img.url;
  if (img.b64_json) return `data:image/webp;base64,${img.b64_json}`;
  return null;
}

export async function getVeniceBalance(apiKey: string): Promise<number | null> {
  try {
    const res = await fetch("https://api.venice.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const balance = res.headers.get("x-venice-balance-usd");
    return balance ? parseFloat(balance) : null;
  } catch {
    return null;
  }
}
