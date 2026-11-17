export interface VSLInput {
  niche: string;
  mechanism: string;
  market: string;
  splitTestLeads: number;
  trainingExamples: string[];
}

export interface VSLLead {
  hook: string;
}

export interface VSLOutput {
  leads: VSLLead[];
  strategy: string;
  psychology: string;
  mechanism: string;
  bigIdea: string;
  story: string;
  logic: string;
  close: string;
  fullScript: string;
}

const AGENTS = [
  {
    name: "Estrategista",
    role: "Define o posicionamento, o ângulo de mercado e a estrutura geral da VSL.",
  },
  {
    name: "Psicólogo",
    role: "Identifica a dor profunda, o desejo real, as crenças limitantes e os gatilhos emocionais do avatar.",
  },
  {
    name: "Mecanicista",
    role: "Articula o mecanismo único — por que o problema existe, por que outras soluções falham e como este resolve de forma diferente.",
  },
  {
    name: "Big Ideia",
    role: "Formula o conceito central da VSL — a ideia surpresa que conecta tudo e que o espectador vai lembrar.",
  },
  {
    name: "Storyteller",
    role: "Escreve a narrativa: história do personagem, jornada, virada emocional, prova.",
  },
  {
    name: "Lógico",
    role: "Constrói a prova racional: dados, estudos, lógica sequencial que justifica a crença.",
  },
  {
    name: "Fechador",
    role: "Escreve a oferta, o stack de valor, a urgência, a garantia e o CTA final.",
  },
];

export function buildVSLAgentPrompt(
  agentIndex: number,
  input: VSLInput,
  previousOutputs: Record<string, string>,
  knowledge?: string
): string {
  const agent = AGENTS[agentIndex];
  const trainingContext =
    input.trainingExamples.length > 0
      ? `ROTEIROS DE TREINO (DNA base):\n${input.trainingExamples.slice(0, 3).map((e, i) => `${i + 1}. ${e.slice(0, 500)}...`).join("\n\n")}`
      : "";

  const previousContext = Object.keys(previousOutputs).length > 0
    ? `TRABALHO DOS AGENTES ANTERIORES:\n${Object.entries(previousOutputs)
        .map(([k, v]) => `[${k}]: ${v}`)
        .join("\n\n")}`
    : "";

  const knowledgeSection = knowledge
    ? `BASE DE CONHECIMENTO (use como referência estrutural):\n${knowledge.slice(0, 3000)}`
    : "";

  return `Você é o agente ${agent.name} no método Puzzle Pieces para criação de VSLs.

SUA FUNÇÃO: ${agent.role}

BRIEFING:
- Nicho: ${input.niche}
- Mecanismo central: ${input.mechanism}
- Mercado alvo: ${input.market}

${knowledgeSection}

${trainingContext}

${previousContext}

REGRAS:
- Output em inglês (US), pronto para voiceover
- Sem marcações de cena, asteriscos ou colchetes
- Texto corrido, narrativo, conversacional
- Não repita o que os agentes anteriores já escreveram — apenas complemente e aprofunde
- Mantenha o mecanismo fornecido intacto

Escreva sua contribuição agora (apenas texto, sem explicações meta):`;
}

export function buildVSLLeadPrompt(input: VSLInput, bodyContext: string): string {
  return `Você é copywriter especializado em ganchos de VSL (primeiros 60 segundos).

CONTEXTO DA VSL:
${bodyContext.slice(0, 800)}

TAREFA: Escreva ${input.splitTestLeads} variações de gancho (hook) diferentes para esta VSL.
Cada gancho deve:
- Ter entre 3 e 6 parágrafos
- Usar um ângulo diferente (curiosidade, medo, prova, história, estatística)
- Terminar exatamente onde o corpo da VSL começa (sem transição explícita)
- Estar em inglês (US), pronto para voiceover

Retorne JSON:
{
  "leads": [
    { "hook": "texto completo do gancho..." }
  ]
}`;
}

export const MARKETS = [
  "US — Inglês americano, cultura mainstream",
  "BR — Português brasileiro, localização completa",
  "LATAM Espanhol — Espanhol neutro, mercado hispânico US",
  "UK — Inglês britânico",
];

export { AGENTS };
