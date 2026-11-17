export type AdsMode = "generate" | "transmute" | "sexy";

export interface AdsInput {
  mode: AdsMode;
  niche: string;
  mechanism: string;
  trainingExamples: string[];
  quantity: number;
}

export interface AdsLayer {
  hook: string;
  body: string;
  cta: string;
  psychology: string;
  scenes: string;
  rhythm: string;
  triggers: string;
}

export interface AdsItem {
  angle: string;
  layers: AdsLayer;
  fullCopy: string;
}

export interface AdsOutput {
  items: AdsItem[];
}

const MODE_INSTRUCTIONS: Record<AdsMode, string> = {
  generate: `MODO GENERATE: Clone a fórmula dos exemplos de treino. Mantenha a estrutura, o ritmo e o vocabulário. Gere copy nova no mesmo DNA — não copie frases, mas copie a lógica e o tom.`,
  transmute: `MODO TRANSMUTE: Reescreva do zero. Mesmo mecanismo, novo ângulo, novo vocabulário. O output deve ser irreconhecível em relação aos exemplos, mas trabalhar o mesmo conceito central.`,
  sexy: `MODO SEXY: Versão agressiva. Mais urgência, mais emoção, mais pressão. Linguagem mais direta e visceral. Ainda dentro das diretrizes de plataforma — sem promessas médicas explícitas.`,
};

export function buildAdsSystemPrompt(
  trainingExamples: string[],
  mode: AdsMode,
  knowledge?: string
): string {
  const examples =
    trainingExamples.length > 0
      ? `EXEMPLOS DE TREINO (DNA a replicar):\n${trainingExamples.map((e, i) => `${i + 1}. ${e}`).join("\n\n")}`
      : "Sem exemplos de treino. Use as melhores práticas de copy de Facebook Ads para saúde.";

  const knowledgeSection = knowledge
    ? `\n\n${knowledge}\n\nUse o framework e os padrões acima para estruturar cada camada.`
    : "";

  return `Você é um copywriter de performance especializado em Facebook Ads de saúde para o mercado americano.
Escreve copy em inglês (US) pronto para voiceover — sem marcadores de cena, sem colchetes, sem instruções de entrega.

${MODE_INSTRUCTIONS[mode]}

REGRAS INVIOLÁVEIS:
- Inglês (US), voz conversacional
- Mecanismo travado: use o mecanismo fornecido, não invente outro
- Memória anti-repetição: cada item do lote deve ter ângulo diferente
- Sem promessas de resultado específico (sem "perde X kg", "cura", "elimina em Y dias")
- Copy pronta para gravar — sem asteriscos, colchetes ou marcações

ESTRUTURA 7 CAMADAS (preencha cada uma):
1. Hook: gancho em 1-2 frases que para o scroll
2. Body: desenvolvimento do problema/solução (3-5 parágrafos)
3. CTA: chamada para ação clara e direta
4. Psychology: qual gatilho psicológico central está sendo ativado
5. Scenes: que cenas mentais o ouvinte visualiza
6. Rhythm: como o ritmo da copy funciona (curto/longo, perguntas/afirmações)
7. Triggers: lista dos gatilhos usados (curiosidade, medo, prova social, etc.)
${knowledgeSection}
${examples}`;
}

export function buildAdsUserPrompt(input: AdsInput): string {
  return `Gere ${input.quantity} anúncio(s) para o nicho "${input.niche}".
Mecanismo central: "${input.mechanism}"

Para cada anúncio, atribua um ângulo diferente e preencha as 7 camadas.

Retorne JSON válido:
{
  "items": [
    {
      "angle": "nome do ângulo usado",
      "layers": {
        "hook": "...",
        "body": "...",
        "cta": "...",
        "psychology": "...",
        "scenes": "...",
        "rhythm": "...",
        "triggers": "..."
      },
      "fullCopy": "copy completa pronta para voiceover, sem marcações"
    }
  ]
}`;
}
