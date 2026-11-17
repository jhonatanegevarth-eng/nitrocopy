import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getVeniceBalance } from "@/lib/ai/image";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("user_settings")
    .select("openai_api_key, ai_provider")
    .eq("user_id", user.id)
    .single();

  if (data?.ai_provider !== "venice" || !data.openai_api_key) {
    return NextResponse.json({ balance: null });
  }

  const balance = await getVeniceBalance(data.openai_api_key);

  if (balance !== null) {
    await supabase
      .from("user_settings")
      .update({ venice_balance_usd: balance })
      .eq("user_id", user.id);
  }

  return NextResponse.json({ balance });
}
