import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getSettingsRepo, getTrainingRepo, getGenerationsRepo } from "@/lib/db";
import { generateText } from "@/lib/ai/text";
import { generateImage } from "@/lib/ai/image";
import {
  buildNativeSystemPrompt,
  buildNativeUserPrompt,
  type NativeInput,
  type NativeOutput,
} from "@/lib/prompts/native";
import { nativeKnowledge } from "@/lib/knowledge";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const settingsRepo = await getSettingsRepo();
    const settings = await settingsRepo.get(user.id);

    const apiKey = settings?.openai_api_key ?? "";
    if (!apiKey) return NextResponse.json({ error: "Configure sua chave de API em Configurações." }, { status: 400 });

    const body: NativeInput & { generateImages?: boolean } = await req.json();
    const { generateImages = false, ...input } = body;
    const provider = settings?.ai_provider ?? undefined;

    const trainingRepo = await getTrainingRepo();
    const training = await trainingRepo.list(user.id, "native", 15);

    const dnaEntry = training.find((t) => t.label === "__dna__");
    const regularExamples = training.filter((t) => t.label !== "__dna__").map((t) => t.content);
    const trainingExamples = dnaEntry
      ? [`PERFIL DNA DO AUTOR:\n${dnaEntry.content}`, ...regularExamples.slice(0, 8)]
      : regularExamples.slice(0, 10);

    const knowledge = nativeKnowledge();
    console.log("[knowledge] native", knowledge.length, "chars");
    const system = buildNativeSystemPrompt(trainingExamples, knowledge);
    const userMsg = buildNativeUserPrompt({ ...input, trainingExamples }, []);

    const { content } = await generateText({
      system,
      user: userMsg,
      apiKey,
      jsonMode: true,
      providerOverride: provider,
    });

    const parsed: NativeOutput = JSON.parse(content);

    if (generateImages && parsed.items) {
      const imageResults = await Promise.allSettled(
        parsed.items.map((item) => generateImage(item.imagePrompt, apiKey, provider))
      );
      parsed.items = parsed.items.map((item, i) => ({
        ...item,
        imageUrl:
          imageResults[i].status === "fulfilled"
            ? (imageResults[i] as PromiseFulfilledResult<string | null>).value
            : null,
      }));
    }

    const generationsRepo = await getGenerationsRepo();
    await generationsRepo.insert(user.id, {
      tool: "native",
      input: { niche: input.niche, angle: input.angle, quantity: input.quantity },
      output: parsed,
    });

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
