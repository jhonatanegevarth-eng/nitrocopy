import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getSettingsRepo, getTrainingRepo } from "@/lib/db";
import type { ToolType } from "@/lib/db";
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
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tool } = (await req.json()) as { tool: ToolType };

    const settingsRepo = await getSettingsRepo();
    const settings = await settingsRepo.get(user.id);

    const apiKey = settings?.openai_api_key ?? "";
    if (!apiKey)
      return NextResponse.json({ error: "Configure sua chave de API em Configurações." }, { status: 400 });

    const trainingRepo = await getTrainingRepo();
    const entries = await trainingRepo.listExcludingLabel(user.id, tool, DNA_LABEL, 30);

    if (entries.length < 2) {
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

    await trainingRepo.deleteByLabel(user.id, tool, DNA_LABEL);
    await trainingRepo.insert(user.id, tool, dnaProfile, DNA_LABEL);

    return NextResponse.json({ dna: dnaProfile });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
