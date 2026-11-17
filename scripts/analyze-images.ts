/**
 * Analisa imagens do corpus e extrai padrões de hooks visuais.
 * Uso: npx tsx scripts/analyze-images.ts
 * Requer no .env.local:
 *   SCRIPT_AI_API_KEY   — chave da API (OpenAI ou Venice)
 *   SCRIPT_AI_PROVIDER  — "openai" (padrão) ou "venice"
 *
 * Corpus: corpus/images/
 *   - Imagens reais (.jpg/.jpeg/.png/.webp) → redimensionadas para ≤1024px, enviadas ao modelo de visão
 *   - Arquivos .txt/.md → uma descrição textual por linha (fallback)
 */
import { config } from "dotenv";
import { readFileSync, readdirSync, writeFileSync, existsSync } from "fs";
import { join, extname } from "path";
import OpenAI from "openai";
import sharp from "sharp";
import { MODELS, type Provider } from "../src/lib/ai/models";

config({ path: ".env.local" });

const CORPUS_DIR = join(process.cwd(), "corpus/images");
const CACHE_DIR = join(process.cwd(), "analysis-cache");
const CACHE_FILE = join(CACHE_DIR, "images-analysis.json");

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const TEXT_EXTS = new Set([".txt", ".md"]);

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

const VENICE_BASE_URL = "https://api.venice.ai/api/v1";
const MAX_IMAGE_WIDTH = 1024;

interface ImageAnalysis {
  file: string;
  source: "image" | "text_description";
  hookType: string;
  niche: string;
  compositionNotes: string;
  promptTemplate: string;
  analyzedAt: string;
}

interface CacheEntry {
  hash: string;
  analysis: ImageAnalysis;
}

function simpleHash(content: string | Buffer): string {
  const str = typeof content === "string" ? content : content.toString("base64").slice(0, 500);
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
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

async function resizeImage(buffer: Buffer, ext: string): Promise<{ data: Buffer; mime: string }> {
  const mime = MIME[ext] ?? "image/jpeg";
  const resized = await sharp(buffer)
    .resize(MAX_IMAGE_WIDTH, undefined, { withoutEnlargement: true })
    .toFormat(ext === ".png" ? "png" : "jpeg", { quality: 85 })
    .toBuffer();
  return { data: resized, mime: ext === ".png" ? "image/png" : "image/jpeg" };
}

const SYSTEM_PROMPT = `You are a native advertising creative director. Analyze the image/description and return JSON with:
- hookType: the visual hook pattern (skin_annotation, food_macro, bedroom_witness, self_test, medical_scan, loose_waistband, hands_holding_result, surprised_face, before_diagnosis, scale_or_tape, medical_document, forbidden_food, other)
- niche: health niche this image works for (1-3 words)
- compositionNotes: what makes this image effective as a native ad (1 sentence)
- promptTemplate: reusable image generation prompt template for this style (1-2 sentences, no product)
Return only valid JSON.`;

async function analyzeImageFile(
  client: OpenAI,
  model: string,
  filepath: string,
  filename: string
): Promise<Omit<ImageAnalysis, "file" | "analyzedAt" | "source">> {
  const ext = extname(filename).toLowerCase();
  const rawBuffer = readFileSync(filepath);
  const { data: resizedBuffer, mime } = await resizeImage(rawBuffer, ext);

  const origKB = Math.round(rawBuffer.length / 1024);
  const resizedKB = Math.round(resizedBuffer.length / 1024);
  if (origKB !== resizedKB) {
    process.stdout.write(` (${origKB}KB→${resizedKB}KB)`);
  }

  const base64 = resizedBuffer.toString("base64");

  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mime};base64,${base64}` },
          },
          { type: "text", text: `Analyze this native ad image:\n${SYSTEM_PROMPT}` },
        ],
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
    max_tokens: 400,
  });

  return JSON.parse(
    completion.choices[0].message.content ?? "{}"
  ) as Omit<ImageAnalysis, "file" | "analyzedAt" | "source">;
}

async function analyzeTextDescription(
  client: OpenAI,
  model: string,
  description: string
): Promise<Omit<ImageAnalysis, "file" | "analyzedAt" | "source">> {
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Analyze this image description: "${description.trim()}"` },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
    max_tokens: 400,
  });

  return JSON.parse(
    completion.choices[0].message.content ?? "{}"
  ) as Omit<ImageAnalysis, "file" | "analyzedAt" | "source">;
}

async function main() {
  const apiKey = process.env.SCRIPT_AI_API_KEY;
  if (!apiKey) {
    console.error("Missing SCRIPT_AI_API_KEY in .env.local");
    process.exit(1);
  }

  const rawProvider = (process.env.SCRIPT_AI_PROVIDER ?? "openai").toLowerCase() as Provider;
  const provider: Provider = rawProvider === "venice" ? "venice" : "openai";
  const model = MODELS[provider].vision;

  const clientOptions: ConstructorParameters<typeof OpenAI>[0] = { apiKey };
  if (provider === "venice") clientOptions.baseURL = VENICE_BASE_URL;
  const client = new OpenAI(clientOptions);

  console.log(`Provider: ${provider} | Vision model: ${model}`);

  const cache = loadCache();

  const files = readdirSync(CORPUS_DIR).filter((f) => {
    const ext = extname(f).toLowerCase();
    return IMAGE_EXTS.has(ext) || TEXT_EXTS.has(ext);
  });

  if (files.length === 0) {
    console.log(
      "No files in corpus/images. Add .jpg/.png/.webp images (or .txt with descriptions as fallback)."
    );
    return;
  }

  const imageFiles = files.filter((f) => IMAGE_EXTS.has(extname(f).toLowerCase()));
  const textFiles = files.filter((f) => TEXT_EXTS.has(extname(f).toLowerCase()));

  console.log(`Found ${imageFiles.length} image(s), ${textFiles.length} text file(s).`);

  let processed = 0;
  let skipped = 0;

  // --- Real images (primary path) ---
  for (const file of imageFiles) {
    const filepath = join(CORPUS_DIR, file);
    const buffer = readFileSync(filepath);
    const hash = simpleHash(buffer);

    if (cache[hash]) {
      skipped++;
      continue;
    }

    try {
      process.stdout.write(`[img] ${file}`);
      const analysis = await analyzeImageFile(client, model, filepath, file);
      cache[hash] = {
        hash,
        analysis: { ...analysis, file, source: "image", analyzedAt: new Date().toISOString() },
      };
      processed++;
      console.log(` → ${analysis.hookType} / ${analysis.niche}`);
      saveCache(cache);
    } catch (err) {
      console.error(`\nError analyzing image: ${file}`, err);
    }
  }

  // --- Text descriptions (fallback) ---
  for (const file of textFiles) {
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
        const analysis = await analyzeTextDescription(client, model, line);
        cache[hash] = {
          hash,
          analysis: {
            ...analysis,
            file,
            source: "text_description",
            analyzedAt: new Date().toISOString(),
          },
        };
        processed++;
        console.log(`[txt] ${line.slice(0, 50)}... → ${analysis.hookType} / ${analysis.niche}`);
        saveCache(cache);
      } catch (err) {
        console.error(`Error analyzing description: ${line.slice(0, 40)}`, err);
      }
    }
  }

  console.log(`\nDone. Processed: ${processed}, Skipped (cached): ${skipped}`);
}

main().catch(console.error);
