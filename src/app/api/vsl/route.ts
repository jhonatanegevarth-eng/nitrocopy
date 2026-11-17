import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getSettingsRepo, getTrainingRepo, getGenerationsRepo } from "@/lib/db";
import { generateText } from "@/lib/ai/text";
import {
  buildVSLAgentPrompt,
  buildVSLLeadPrompt,
  AGENTS,
  type VSLInput,
  type VSLOutput,
} from "@/lib/prompts/vsl";
import { vslKnowledge } from "@/lib/knowledge";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const settingsRepo = await getSettingsRepo();
    const settings = await settingsRepo.get(user.id);

    const apiKey = settings?.openai_api_key ?? "";
    if (!apiKey) return NextResponse.json({ error: "Configure sua chave de API em Configurações." }, { status: 400 });

    const input: VSLInput = await req.json();
    const provider = settings?.ai_provider ?? undefined;

    const trainingRepo = await getTrainingRepo();
    const training = await trainingRepo.list(user.id, "vsl", 10);

    const dnaEntry = training.find((t) => t.label === "__dna__");
    const regularExamples = training.filter((t) => t.label !== "__dna__").map((t) => t.content);
    const trainingExamples = dnaEntry
      ? [`PERFIL DNA DO AUTOR:\n${dnaEntry.content}`, ...regularExamples.slice(0, 4)]
      : regularExamples.slice(0, 5);

    const knowledge = vslKnowledge();
    console.log("[knowledge] vsl", knowledge.length, "chars");

    const agentOutputs: Record<string, string> = {};

    for (let i = 0; i < AGENTS.length; i++) {
      const prompt = buildVSLAgentPrompt(i, { ...input, trainingExamples }, agentOutputs, knowledge);
      const { content } = await generateText({
        system: "",
        user: prompt,
        apiKey,
        jsonMode: false,
        temperature: 0.8,
        providerOverride: provider,
      });
      agentOutputs[AGENTS[i].name] = content;
    }

    const body_text = Object.values(agentOutputs).join("\n\n");

    const { content: leadsRaw } = await generateText({
      system: "",
      user: buildVSLLeadPrompt({ ...input, trainingExamples }, body_text),
      apiKey,
      jsonMode: true,
      temperature: 0.9,
      providerOverride: provider,
    });

    const leadsData = JSON.parse(leadsRaw);

    const output: VSLOutput = {
      leads: leadsData.leads ?? [],
      strategy: agentOutputs[AGENTS[0].name] ?? "",
      psychology: agentOutputs[AGENTS[1].name] ?? "",
      mechanism: agentOutputs[AGENTS[2].name] ?? "",
      bigIdea: agentOutputs[AGENTS[3].name] ?? "",
      story: agentOutputs[AGENTS[4].name] ?? "",
      logic: agentOutputs[AGENTS[5].name] ?? "",
      close: agentOutputs[AGENTS[6].name] ?? "",
      fullScript: body_text,
    };

    const generationsRepo = await getGenerationsRepo();
    await generationsRepo.insert(user.id, {
      tool: "vsl",
      input: { niche: input.niche, mechanism: input.mechanism, market: input.market },
      output,
    });

    return NextResponse.json(output);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
