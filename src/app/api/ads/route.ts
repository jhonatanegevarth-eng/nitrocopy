import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getSettingsRepo, getTrainingRepo, getGenerationsRepo } from "@/lib/db";
import { generateText } from "@/lib/ai/text";
import {
  buildAdsSystemPrompt,
  buildAdsUserPrompt,
  type AdsInput,
  type AdsOutput,
} from "@/lib/prompts/ads";
import { adsKnowledge } from "@/lib/knowledge";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const settingsRepo = await getSettingsRepo();
    const settings = await settingsRepo.get(user.id);

    const apiKey = settings?.openai_api_key ?? "";
    if (!apiKey) return NextResponse.json({ error: "Configure sua chave de API em Configurações." }, { status: 400 });

    const input: AdsInput = await req.json();
    const provider = settings?.ai_provider ?? undefined;

    const trainingRepo = await getTrainingRepo();
    const training = await trainingRepo.list(user.id, "ads", 15);

    const dnaEntry = training.find((t) => t.label === "__dna__");
    const regularExamples = training.filter((t) => t.label !== "__dna__").map((t) => t.content);
    const trainingExamples = dnaEntry
      ? [`PERFIL DNA DO AUTOR:\n${dnaEntry.content}`, ...regularExamples.slice(0, 8)]
      : regularExamples.slice(0, 10);

    const knowledge = adsKnowledge();
    console.log("[knowledge] ads", knowledge.length, "chars");
    const system = buildAdsSystemPrompt(trainingExamples, input.mode, knowledge);
    const userMsg = buildAdsUserPrompt({ ...input, trainingExamples });

    const { content } = await generateText({
      system,
      user: userMsg,
      apiKey,
      jsonMode: true,
      providerOverride: provider,
    });

    const parsed: AdsOutput = JSON.parse(content);

    const generationsRepo = await getGenerationsRepo();
    await generationsRepo.insert(user.id, {
      tool: "ads",
      mode: input.mode,
      input: { niche: input.niche, mechanism: input.mechanism, mode: input.mode, quantity: input.quantity },
      output: parsed,
    });

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
