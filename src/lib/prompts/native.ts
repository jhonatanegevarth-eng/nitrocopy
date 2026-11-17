export interface NativeInput {
  niche: string;
  angle: string;
  quantity: number;
  trainingExamples: string[];
}

export interface NativeItem {
  headline: string;
  description: string;
  riskLevel: "low" | "medium" | "high";
  riskReason: string;
  visualHook: string;
  imagePrompt: string;
}

export interface NativeOutput {
  items: NativeItem[];
}

const VISUAL_HOOKS = [
  "Anotação na pele",
  "Macro de comida",
  "Quarto testemunha",
  "Autoteste agora",
  "Exame de imagem",
  "Cós folgado",
  "Mãos segurando resultado",
  "Close no rosto surpreso",
  "Antes do diagnóstico",
  "Balança ou fita métrica",
  "Documento médico real",
  "Alimento proibido em destaque",
];

export function buildNativeSystemPrompt(
  trainingExamples: string[],
  knowledge?: string
): string {
  const examples =
    trainingExamples.length > 0
      ? `EXEMPLOS TREINADOS PELO USUÁRIO (DNA a replicar):\n${trainingExamples.map((e, i) => `${i + 1}. ${e}`).join("\n")}`
      : "Nenhum exemplo de treino fornecido. Use boas práticas de native ads de saúde.";

  const knowledgeSection = knowledge
    ? `\n\n${knowledge}\n\nUse o conhecimento acima para calibrar ângulos, risco e hooks visuais.`
    : "";

  return `Você é um copywriter especialista em native ads de saúde para o mercado americano (US).
Seu trabalho é gerar headlines e descrições para anúncios nativos no padrão da Taboola/Outbrain.

REGRAS INVIOLÁVEIS:
- Headlines em inglês (US), entre 6 e 12 palavras
- Tom: curiosidade, urgência velada, benefício claro
- Sem exageros que causem reprovação (não use "cura", "elimina", "perde X kg em Y dias")
- Cada headline do lote deve ter ângulo completamente diferente
- Descrição: 1 frase curta que amplia a headline sem repetir as mesmas palavras
- Nível de risco de reprovação: low / medium / high — com motivo específico

REGRAS DE IMAGEM (para o imagePrompt):
- Nunca mostrar produto, embalagem, pílula, cápsula
- Nunca texto na arte
- Nunca celebridade ou rosto reconhecível
- Nunca "antes e depois"
- Cada item recebe um gancho visual diferente da lista fornecida
- O imagePrompt deve ser em inglês, descritivo, fotorrealista
${knowledgeSection}
${examples}`;
}

export function buildNativeUserPrompt(input: NativeInput, usedHooks: string[]): string {
  const availableHooks = VISUAL_HOOKS.filter((h) => !usedHooks.includes(h));
  const hooksToAssign = availableHooks.slice(0, input.quantity);

  return `Gere ${input.quantity} itens de native ad para o nicho "${input.niche}" com ângulo "${input.angle}".

Para cada item, atribua um gancho visual desta lista (na ordem, sem repetir):
${hooksToAssign.map((h, i) => `Item ${i + 1}: "${h}"`).join("\n")}

Retorne JSON válido no formato:
{
  "items": [
    {
      "headline": "...",
      "description": "...",
      "riskLevel": "low|medium|high",
      "riskReason": "...",
      "visualHook": "...",
      "imagePrompt": "Photorealistic scene: ..."
    }
  ]
}`;
}

export const NATIVE_ANGLES = [
  "Pressão",
  "Nutriente Esquecido",
  "Risco Baixo",
  "Médico Revela",
  "Método Japonês",
  "O Que Eles Não Querem Que Você Saiba",
  "Sintoma Ignorado",
  "Erro Comum",
  "Descoberta Recente",
  "Truque Simples",
];

export const VISUAL_HOOKS_EXPORT = VISUAL_HOOKS;
