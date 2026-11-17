/**
 * Agrega os caches de análise e atualiza os arquivos .md de /knowledge.
 * Uso: npx tsx scripts/build-knowledge.ts
 * Requer SCRIPT_AI_API_KEY no .env.local para geração de insights.
 * Idempotente: não regera .md se o cache não mudou desde a última build.
 */
import { config } from "dotenv";
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "fs";
import { join } from "path";
import OpenAI from "openai";
import { MODELS } from "../src/lib/ai/models";

config({ path: ".env.local" });

const CACHE_DIR = join(process.cwd(), "analysis-cache");
const KNOWLEDGE_DIR = join(process.cwd(), "knowledge");
const BUILD_META_FILE = join(CACHE_DIR, "build-meta.json");

interface BuildMeta {
  lastBuildAt: string;
  headlinesCacheHash: string;
  imagesCacheHash: string;
  vslsCacheHash: string;
}

function simpleHash(content: string): string {
  let h = 0;
  for (let i = 0; i < content.length; i++) {
    h = ((h << 5) - h + content.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(8, "0");
}

function loadCache(name: string): Record<string, unknown> {
  const f = join(CACHE_DIR, `${name}-analysis.json`);
  if (!existsSync(f)) return {};
  try {
    return JSON.parse(readFileSync(f, "utf-8"));
  } catch {
    return {};
  }
}

function loadBuildMeta(): BuildMeta | null {
  if (!existsSync(BUILD_META_FILE)) return null;
  try {
    return JSON.parse(readFileSync(BUILD_META_FILE, "utf-8"));
  } catch {
    return null;
  }
}

function saveBuildMeta(meta: BuildMeta): void {
  writeFileSync(BUILD_META_FILE, JSON.stringify(meta, null, 2));
}

function backupMd(name: string): void {
  const src = join(KNOWLEDGE_DIR, `${name}.md`);
  if (!existsSync(src)) return;
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const dest = join(KNOWLEDGE_DIR, `${name}.${ts}.md.bak`);
  copyFileSync(src, dest);
}

async function generateInsights(
  client: OpenAI,
  section: string,
  data: Record<string, unknown>
): Promise<string> {
  const entries = Object.values(data).slice(0, 50);
  if (entries.length === 0) return "";

  const completion = await client.chat.completions.create({
    model: MODELS.openai.text,
    messages: [
      {
        role: "system",
        content: `You are a copywriting knowledge base curator. Given analysis data from a corpus of real ads/VSLs, generate a concise "## Padrões do Corpus" section for a knowledge .md file. Focus on patterns, frequencies, and actionable rules. Write in Portuguese. Use markdown tables and bullet points. Max 400 words.`,
      },
      {
        role: "user",
        content: `Section: ${section}\n\nData sample:\n${JSON.stringify(entries, null, 2)}`,
      },
    ],
    temperature: 0.3,
  });

  return completion.choices[0].message.content ?? "";
}

async function main() {
  const headlinesCache = loadCache("headlines");
  const imagesCache = loadCache("images");
  const vslsCache = loadCache("vsls");

  const hh = simpleHash(JSON.stringify(headlinesCache));
  const ih = simpleHash(JSON.stringify(imagesCache));
  const vh = simpleHash(JSON.stringify(vslsCache));

  const meta = loadBuildMeta();
  if (
    meta &&
    meta.headlinesCacheHash === hh &&
    meta.imagesCacheHash === ih &&
    meta.vslsCacheHash === vh
  ) {
    console.log("Cache unchanged since last build. Nothing to do.");
    return;
  }

  const apiKey = process.env.SCRIPT_AI_API_KEY;
  if (!apiKey) {
    console.error("Missing SCRIPT_AI_API_KEY in .env.local");
    process.exit(1);
  }

  const client = new OpenAI({ apiKey });

  if (Object.keys(headlinesCache).length > 0) {
    console.log("Building headlines insights...");
    const insights = await generateInsights(client, "Native Headlines", headlinesCache);
    if (insights) {
      backupMd("headlines");
      const base = readFileSync(join(KNOWLEDGE_DIR, "headlines.md"), "utf-8");
      const updated = base.replace(
        /\n## Padrões do Corpus[\s\S]*$/,
        ""
      ) + "\n\n" + insights;
      writeFileSync(join(KNOWLEDGE_DIR, "headlines.md"), updated);
      console.log("headlines.md updated.");
    }
  }

  if (Object.keys(imagesCache).length > 0) {
    console.log("Building image hooks insights...");
    const insights = await generateInsights(client, "Visual Hooks", imagesCache);
    if (insights) {
      backupMd("hooks");
      const base = readFileSync(join(KNOWLEDGE_DIR, "hooks.md"), "utf-8");
      const updated = base.replace(
        /\n## Padrões do Corpus[\s\S]*$/,
        ""
      ) + "\n\n" + insights;
      writeFileSync(join(KNOWLEDGE_DIR, "hooks.md"), updated);
      console.log("hooks.md updated.");
    }
  }

  if (Object.keys(vslsCache).length > 0) {
    console.log("Building VSL insights...");
    const insights = await generateInsights(client, "VSL Structure", vslsCache);
    if (insights) {
      backupMd("vsl-skeleton");
      const base = readFileSync(join(KNOWLEDGE_DIR, "vsl-skeleton.md"), "utf-8");
      const updated = base.replace(
        /\n## Padrões do Corpus[\s\S]*$/,
        ""
      ) + "\n\n" + insights;
      writeFileSync(join(KNOWLEDGE_DIR, "vsl-skeleton.md"), updated);
      console.log("vsl-skeleton.md updated.");
    }
  }

  saveBuildMeta({
    lastBuildAt: new Date().toISOString(),
    headlinesCacheHash: hh,
    imagesCacheHash: ih,
    vslsCacheHash: vh,
  });

  console.log("Knowledge build complete.");
}

main().catch(console.error);
