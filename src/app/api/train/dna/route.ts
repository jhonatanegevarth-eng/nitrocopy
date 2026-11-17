import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/ai/text";

const DNA_LABEL = "__dna__";

const DNA_SYSTEM = `You are a copywriting style analyst. Given a set of copy examples written by the same person, extract a concise DNA profile that captures:
1. Voice & Tone: how they write (first person / narrator, formal / casual, aggressive / empathetic)
2. Sentence rhythm: long/short mix, use of questions, fragments, ellipsis
3. Favorite triggers: which psychological levers they use most
4. Opening patterns: how they typically start headlines or hooks
5. Closing patterns: how they drive to action
6. Words/phrases they overuse (positively — their signature)
7. Things they avoid

Output a structured profile in Portuguese. Max 500 words. Use bullet points.`;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tool } = (await req.json()) as { tool: "native" | "ads" | "vsl" };

    const { data: settings } = await supabase
      .from("user_settings")
      .select("openai_api_key, ai_provider")
      .eq("user_id", user.id)
      .single();

    const apiKey = settings?.openai_api_key ?? "";
    if (!apiKey)
      return NextResponse.json({ error: "Configure sua chave de API em Configurações." }, { status: 400 });

    const { data: entries } = await supabase
      .from("training_entries")
      .select("content, label")
      .eq("user_id", user.id)
      .eq("tool", tool)
      .neq("label", DNA_LABEL)
      .order("created_at", { ascending: false })
      .limit(30);

    if (!entries || entries.length < 2) {
      return NextResponse.json(
        { error: "Adicione pelo menos 2 exemplos de treino antes de gerar o DNA." },
        { status: 400 }
      );
    }

    const examplesText = entries
      .map((e, i) => `Exemplo ${i + 1}${e.label ? ` (${e.label})` : ""}:\n${e.content}`)
      .join("\n\n---\n\n");

    const { content: dnaProfile } = await generateText({
      system: DNA_SYSTEM,
      user: `Analise estes ${entries.length} exemplos de copy e extraia o DNA do autor:\n\n${examplesText}`,
      apiKey,
      jsonMode: false,
      temperature: 0.3,
      providerOverride: settings?.ai_provider ?? undefined,
    });

    await supabase
      .from("training_entries")
      .delete()
      .eq("user_id", user.id)
      .eq("tool", tool)
      .eq("label", DNA_LABEL);

    await supabase.from("training_entries").insert({
      user_id: user.id,
      tool,
      label: DNA_LABEL,
      content: dnaProfile,
    });

    return NextResponse.json({ dna: dnaProfile });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
