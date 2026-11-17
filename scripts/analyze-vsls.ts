/**
 * Analisa transcrições de VSLs do corpus e extrai padrões estruturais.
 * Uso: npx tsx scripts/analyze-vsls.ts
 * Requer SCRIPT_AI_API_KEY no .env.local
 * Corpus: corpus/vsls/*.txt (uma transcrição por arquivo)
 */
import { config } from "dotenv";
import { readFileSync, readdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import OpenAI from "openai";
import { MODELS } from "../src/lib/ai/models";

config({ path: ".env.local" });

const CORPUS_DIR = join(process.cwd(), "corpus/vsls");
const CACHE_DIR = join(process.cwd(), "analysis-cache");
const CACHE_FILE = join(CACHE_DIR, "vsls-analysis.json");

interface VSLAnalysis {
  file: string;
  bigIdea: string;
  mechanism: string;
  leadType: string;
  closingType: string;
  market: string;
  openLoop: string;
  priceAnchor: string;
  analyzedAt: string;
}

interface CacheEntry {
  hash: string;
  analysis: VSLAnalysis;
}

function simpleHash(content: string): string {
  let h = 0;
  for (let i = 0; i < Math.min(content.length, 2000); i++) {
    h = ((h << 5) - h + content.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(8, "0");
}

function loadCache(): Record<string, CacheEntry> {
  if (!existsSync(CACHE_FILE)) return {};
  try {
    return JSON.parse(readFileSync(CACHE_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, CacheEntry>): void {
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

async function analyzeVSL(
  client: OpenAI,
  content: string
): Promise<Omit<VSLAnalysis, "file" | "analyzedAt">> {
  const excerpt = content.slice(0, 6000);
  const completion = await client.chat.completions.create({
    model: MODELS.openai.text,
    messages: [
      {
        role: "system",
        content: `You are a VSL copywriting analyst. Analyze VSL transcripts and return JSON with:
- bigIdea: the central paradox or revelation (1 sentence)
- mechanism: the unique mechanism name and explanation (1-2 sentences)
- leadType: one of [curiosity, shock, empathy, authority, revelation]
- closingType: one of [logical, emotional, urgency, loss]
- market: one of [us_english, br_portuguese, latam_spanish, uk_english, unknown]
- openLoop: the unresolved tension that keeps viewers watching (1 sentence)
- priceAnchor: the anchor price strategy used (1 sentence, or "not found")
Return only valid JSON.`,
      },
      {
        role: "user",
        content: `Analyze this VSL transcript (first 6000 chars):\n\n${excerpt}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  return JSON.parse(
    completion.choices[0].message.content ?? "{}"
  ) as Omit<VSLAnalysis, "file" | "analyzedAt">;
}

async function main() {
  const apiKey = process.env.SCRIPT_AI_API_KEY;
  if (!apiKey) {
    console.error("Missing SCRIPT_AI_API_KEY in .env.local");
    process.exit(1);
  }

  const client = new OpenAI({ apiKey });
  const cache = loadCache();

  const files = readdirSync(CORPUS_DIR).filter(
    (f) => f.endsWith(".txt") || f.endsWith(".md")
  );

  if (files.length === 0) {
    console.log(
      "No files in corpus/vsls. Add .txt files with VSL transcripts."
    );
    return;
  }

  let processed = 0;
  let skipped = 0;

  for (const file of files) {
    const filepath = join(CORPUS_DIR, file);
    const content = readFileSync(filepath, "utf-8");
    const hash = simpleHash(content);

    if (cache[hash]) {
      skipped++;
      console.log(`[skip] ${file} (cached)`);
      continue;
    }

    try {
      const analysis = await analyzeVSL(client, content);
      cache[hash] = {
        hash,
        analysis: {
          ...analysis,
          file,
          analyzedAt: new Date().toISOString(),
        },
      };
      processed++;
      console.log(`[${processed}] ${file} → ${analysis.leadType} lead / ${analysis.market}`);
      saveCache(cache);
    } catch (err) {
      console.error(`Error analyzing ${file}:`, err);
    }
  }

  console.log(`\nDone. Processed: ${processed}, Skipped (cached): ${skipped}`);
}

main().catch(console.error);
