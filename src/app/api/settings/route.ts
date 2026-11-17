import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getSettingsRepo } from "@/lib/db";
import { getVeniceBalance } from "@/lib/ai/image";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const repo = await getSettingsRepo();
  const data = await repo.get(user.id);

  const key = data?.openai_api_key ?? "";
  const masked = key.length > 8 ? `${key.slice(0, 7)}${"•".repeat(key.length - 11)}${key.slice(-4)}` : "";

  return NextResponse.json({
    hasKey: !!key,
    maskedKey: masked,
    provider: data?.ai_provider ?? "openai",
    veniceBalance: data?.venice_balance_usd ?? null,
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { api_key, ai_provider } = body as { api_key?: string; ai_provider?: string };

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (api_key !== undefined && typeof api_key === "string" && api_key.trim()) {
    updates.openai_api_key = api_key.trim();
  }
  if (ai_provider === "openai" || ai_provider === "venice") {
    updates.ai_provider = ai_provider;
  }

  const repo = await getSettingsRepo();
  await repo.upsert(user.id, updates);

  const keyToCheck = updates.openai_api_key as string | undefined;
  if (keyToCheck && (ai_provider === "venice" || (!ai_provider && body.ai_provider !== "openai"))) {
    const balance = await getVeniceBalance(keyToCheck);
    if (balance !== null) {
      await repo.updateBalance(user.id, balance);
    }
  }

  const saved = await repo.get(user.id);
  const k = saved?.openai_api_key ?? "";
  const maskedKey = k.length > 8 ? `${k.slice(0, 7)}${"•".repeat(k.length - 11)}${k.slice(-4)}` : "";

  return NextResponse.json({ success: true, maskedKey });
}
