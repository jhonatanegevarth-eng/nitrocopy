import { NextResponse } from "next/server";
import { getCurrentUser, getSettingsRepo } from "@/lib/db";
import { getVeniceBalance } from "@/lib/ai/image";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const repo = await getSettingsRepo();
  const data = await repo.get(user.id);

  if (data?.ai_provider !== "venice" || !data.openai_api_key) {
    return NextResponse.json({ balance: null });
  }

  const balance = await getVeniceBalance(data.openai_api_key);

  if (balance !== null) {
    await repo.updateBalance(user.id, balance);
  }

  return NextResponse.json({ balance });
}
