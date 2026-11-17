import { readFileSync, existsSync } from "fs";
import { join } from "path";

const KNOWLEDGE_DIR = join(process.cwd(), "knowledge");

type KnowledgeFile = "headlines" | "hooks" | "ads-patterns" | "vsl-skeleton";

const cache: Partial<Record<KnowledgeFile, string>> = {};

export function loadKnowledge(name: KnowledgeFile): string {
  if (cache[name]) return cache[name]!;
  const filepath = join(KNOWLEDGE_DIR, `${name}.md`);
  if (!existsSync(filepath)) return "";
  const content = readFileSync(filepath, "utf-8");
  cache[name] = content;
  return content;
}

export function nativeKnowledge(): string {
  const headlines = loadKnowledge("headlines");
  const hooks = loadKnowledge("hooks");
  if (!headlines && !hooks) return "";
  return [
    headlines ? `## BASE DE CONHECIMENTO: HEADLINES\n\n${headlines}` : "",
    hooks ? `## BASE DE CONHECIMENTO: HOOKS VISUAIS\n\n${hooks}` : "",
  ]
    .filter(Boolean)
    .join("\n\n---\n\n");
}

export function adsKnowledge(): string {
  const patterns = loadKnowledge("ads-patterns");
  if (!patterns) return "";
  return `## BASE DE CONHECIMENTO: PADRÕES DE ADS\n\n${patterns}`;
}

export function vslKnowledge(): string {
  const skeleton = loadKnowledge("vsl-skeleton");
  if (!skeleton) return "";
  return `## BASE DE CONHECIMENTO: ESQUELETO DE VSL\n\n${skeleton}`;
}
