/**
 * Analisa headlines do corpus e extrai padrões.
 * Uso: npx tsx scripts/analyze-headlines.ts
 * Requer SCRIPT_AI_API_KEY no .env.local
 */
import { config } from "dotenv";
import { readFileSync, readdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import OpenAI from "openai";
import { MODELS } from "../src/lib/ai/models";

config({ path: ".env.local" });

const CORPUS_DIR = join(process.cwd(), "corpus/headlines");
const CACHE_DIR = join(process.cwd(), "analysis-cache");
const CACHE_FILE = join(CACHE_DIR, "headlines-analysis.json");

interface HeadlineAnalysis {
  file: string;
  angle: string;
  riskLevel: "low" | "medium" | "high";
  estimatedCtr: "low" | "medium" | "high";
  hook: string;
  description: string;
  analyzedAt: string;
}

interface CacheEntry {
  hash: string;
  analysis: HeadlineAnalysis;
}

function simpleHash(content: string): string {
  let h = 0;
  for (let i = 0; i < content.length; i++) {
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

async function analyzeHeadline(
  client: OpenAI,
  content: string
): Promise<Omit<HeadlineAnalysis, "file" | "analyzedAt">> {
  const completion = await client.chat.completions.create({
    model: MODELS.openai.text,
    messages: [
      {
        role: "system",
        content: `You are a native advertising expert. Analyze headlines and return JSON with:
- angle: one of [hidden_cause, forgotten_nutrient, safe_bet, doctor_reveals, foreign_method, hidden_truth, overlooked_symptom, common_mistake, recent_discovery, simple_trick, other]
- riskLevel: one of [low, medium, high] based on ad network policy risk
- estimatedCtr: one of [low, medium, high] based on curiosity/pattern interrupt
- hook: the main psychological trigger (1 short sentence)
- description: why this headline works or doesn't (2 sentences max)
Return only valid JSON.`,
      },
      {
        role: "user",
        content: `Analyze this headline: "${content.trim()}"`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  return JSON.parse(
    completion.choices[0].message.content ?? "{}"
  ) as Omit<HeadlineAnalysis, "file" | "analyzedAt">;
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
      "No files in corpus/headlines. Add .txt files with one headline per line."
    );
    return;
  }

  let processed = 0;
  let skipped = 0;

  for (const file of files) {
    const filepath = join(CORPUS_DIR, file);
    const content = readFileSync(filepath, "utf-8");
    const lines = content
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 10);

    for (const line of lines) {
      const hash = simpleHash(line);
      if (cache[hash]) {
        skipped++;
        continue;
      }

      try {
        const analysis = await analyzeHeadline(client, line);
        cache[hash] = {
          hash,
          analysis: {
            ...analysis,
            file,
            analyzedAt: new Date().toISOString(),
          },
        };
        processed++;
        console.log(`[${processed}] ${line.slice(0, 60)}... → ${analysis.angle} (${analysis.riskLevel} risk)`);
        saveCache(cache);
      } catch (err) {
        console.error(`Error analyzing: ${line.slice(0, 40)}`, err);
      }
    }
  }

  console.log(`\nDone. Processed: ${processed}, Skipped (cached): ${skipped}`);
}

main().catch(console.error);
