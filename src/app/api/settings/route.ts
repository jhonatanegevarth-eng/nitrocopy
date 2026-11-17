import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getVeniceBalance } from "@/lib/ai/image";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("user_settings")
    .select("openai_api_key, ai_provider, venice_balance_usd")
    .eq("user_id", user.id)
    .single();

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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { api_key, ai_provider } = body as { api_key?: string; ai_provider?: string };

  const updates: Record<string, unknown> = {
    user_id: user.id,
    updated_at: new Date().toISOString(),
  };

  if (api_key !== undefined && typeof api_key === "string" && api_key.trim()) {
    updates.openai_api_key = api_key.trim();
  }
  if (ai_provider === "openai" || ai_provider === "venice") {
    updates.ai_provider = ai_provider;
  }

  await supabase.from("user_settings").upsert(updates, { onConflict: "user_id" });

  // If Venice key was just saved, try to read the balance
  const keyToCheck = updates.openai_api_key as string | undefined;
  if (keyToCheck && (ai_provider === "venice" || (!ai_provider && body.ai_provider !== "openai"))) {
    const balance = await getVeniceBalance(keyToCheck);
    if (balance !== null) {
      await supabase
        .from("user_settings")
        .update({ venice_balance_usd: balance })
        .eq("user_id", user.id);
    }
  }

  const { data: saved } = await supabase
    .from("user_settings")
    .select("openai_api_key")
    .eq("user_id", user.id)
    .single();

  const k = saved?.openai_api_key ?? "";
  const maskedKey = k.length > 8 ? `${k.slice(0, 7)}${"•".repeat(k.length - 11)}${k.slice(-4)}` : "";

  return NextResponse.json({ success: true, maskedKey });
}
