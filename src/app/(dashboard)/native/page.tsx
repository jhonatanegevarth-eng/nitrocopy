"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { NATIVE_ANGLES } from "@/lib/prompts/native";
import { cn } from "@/lib/utils";

interface NativeItem {
  headline: string;
  description: string;
  riskLevel: "low" | "medium" | "high";
  riskReason: string;
  visualHook: string;
  imagePrompt: string;
  imageUrl?: string | null;
}

const RISK_COLORS = {
  low: "text-green-400 bg-green-400/10",
  medium: "text-yellow-400 bg-yellow-400/10",
  high: "text-red-400 bg-red-400/10",
};

const RISK_LABELS = { low: "Baixo", medium: "Médio", high: "Alto" };

export default function NativePage() {
  const [niche, setNiche] = useState("");
  const [angle, setAngle] = useState(NATIVE_ANGLES[0]);
  const [customAngle, setCustomAngle] = useState("");
  const [quantity, setQuantity] = useState(6);
  const [generateImages, setGenerateImages] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<NativeItem[]>([]);
  const [activeTab, setActiveTab] = useState<"headlines" | "images">("headlines");

  async function handleGenerate() {
    setError("");
    setLoading(true);
    setResults([]);

    try {
      const res = await fetch("/api/native", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche,
          angle: customAngle || angle,
          quantity,
          generateImages,
          trainingExamples: [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro na geração");
      setResults(data.items ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  function copyAll() {
    const text = results
      .map((r, i) => `[${i + 1}] ${r.headline}\n${r.description}`)
      .join("\n\n");
    navigator.clipboard.writeText(text).catch(() => {});
  }

  return (
    <div className="flex h-full">
      {/* Left panel — form */}
      <div className="w-[280px] min-h-full border-r border-border flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-border">
          <h1 className="text-[15px] font-semibold text-fg">Criador de Native</h1>
          <p className="text-[12.5px] text-fg-muted mt-0.5">Headline + descrição + imagem</p>
        </div>

        <div className="p-5 flex-1 space-y-5 overflow-y-auto">
          <Input
            label="Nicho"
            placeholder="ex: saúde metabólica"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-widest text-fg-muted">
              Ângulo
            </label>
            <div className="flex flex-wrap gap-1.5">
              {NATIVE_ANGLES.map((a) => (
                <button
                  key={a}
                  onClick={() => { setAngle(a); setCustomAngle(""); }}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[11.5px] border transition-colors",
                    angle === a && !customAngle
                      ? "bg-accent-surface border-accent text-accent"
                      : "bg-bg-3 border-border text-fg-muted hover:text-fg"
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
            <input
              placeholder="Ou escreva o seu..."
              value={customAngle}
              onChange={(e) => setCustomAngle(e.target.value)}
              className="w-full mt-1.5 bg-input-bg border border-input-border rounded-lg px-3 py-2 text-[12.5px] text-fg placeholder:text-fg-dim outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-widest text-fg-muted">
              Quantidade
            </label>
            <div className="flex gap-2">
              {[3, 6, 9, 12].map((n) => (
                <button
                  key={n}
                  onClick={() => setQuantity(n)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-[12.5px] border transition-colors",
                    quantity === n
                      ? "bg-accent-surface border-accent text-accent"
                      : "bg-bg-3 border-border text-fg-muted hover:text-fg"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <div
              onClick={() => setGenerateImages(!generateImages)}
              className={cn(
                "w-9 h-5 rounded-full border transition-colors flex items-center",
                generateImages ? "bg-accent border-accent" : "bg-bg-3 border-border"
              )}
            >
              <div
                className={cn(
                  "w-3.5 h-3.5 rounded-full bg-white shadow transition-transform mx-0.5",
                  generateImages ? "translate-x-4" : "translate-x-0"
                )}
              />
            </div>
            <span className="text-[12.5px] text-fg-muted">Gerar imagem (DALL·E)</span>
          </label>

          {error && (
            <p className="text-[12px] text-red-400 bg-red-400/5 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="p-5 border-t border-border">
          <Button
            className="w-full"
            onClick={handleGenerate}
            loading={loading}
            disabled={!niche.trim()}
          >
            {loading ? "Gerando..." : "Gerar lote"}
          </Button>
        </div>
      </div>

      {/* Right panel — results */}
      <div className="flex-1 overflow-y-auto">
        {results.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="text-fg-dim text-4xl mb-4">📰</div>
            <p className="text-fg-muted text-[13.5px] max-w-xs">
              Preencha o nicho e o ângulo, depois clique em{" "}
              <span className="text-fg font-medium">Gerar lote</span> para criar o lote de native ads.
            </p>
          </div>
        ) : (
          <div className="p-5">
            {/* Tabs */}
            {results.length > 0 && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1 bg-bg-3 rounded-lg p-0.5">
                  <button
                    onClick={() => setActiveTab("headlines")}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-[12.5px] transition-colors",
                      activeTab === "headlines" ? "bg-bg-2 text-fg shadow-sm" : "text-fg-muted"
                    )}
                  >
                    Headlines
                  </button>
                  {generateImages && (
                    <button
                      onClick={() => setActiveTab("images")}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-[12.5px] transition-colors",
                        activeTab === "images" ? "bg-bg-2 text-fg shadow-sm" : "text-fg-muted"
                      )}
                    >
                      Imagens
                    </button>
                  )}
                </div>
                <button
                  onClick={copyAll}
                  className="text-[12px] text-fg-muted hover:text-fg flex items-center gap-1.5 transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M1 9V2a1 1 0 0 1 1-1h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  Copiar todos
                </button>
              </div>
            )}

            {activeTab === "headlines" && (
              <div className="space-y-2">
                {results.map((item, i) => (
                  <div key={i} className="bg-bg-2 border border-border rounded-lg p-4 group">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="font-mono text-[10px] text-fg-dim">{String(i + 1).padStart(2, "0")}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded", RISK_COLORS[item.riskLevel])}>
                          Risco {RISK_LABELS[item.riskLevel]}
                        </span>
                        <button
                          onClick={() => navigator.clipboard.writeText(`${item.headline}\n${item.description}`).catch(() => {})}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-fg-dim hover:text-fg"
                        >
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                            <rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                            <path d="M1 9V2a1 1 0 0 1 1-1h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-[14px] font-semibold text-fg mb-1">{item.headline}</p>
                    <p className="text-[12.5px] text-fg-muted mb-2">{item.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10.5px] font-mono text-fg-dim bg-bg-3 px-2 py-0.5 rounded">
                        🎞 {item.visualHook}
                      </span>
                      {item.riskReason && (
                        <span className="text-[10.5px] text-fg-dim">↳ {item.riskReason}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "images" && (
              <div className="grid grid-cols-2 gap-3">
                {results.map((item, i) => (
                  <div key={i} className="bg-bg-2 border border-border rounded-lg overflow-hidden">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.visualHook} className="w-full aspect-[3/2] object-cover" />
                    ) : (
                      <div className="w-full aspect-[3/2] flex items-center justify-center bg-bg-3 text-fg-dim text-[12px]">
                        {loading ? "Gerando..." : "Sem imagem"}
                      </div>
                    )}
                    <div className="p-3">
                      <p className="text-[11.5px] text-fg line-clamp-2">{item.headline}</p>
                      <p className="text-[10.5px] text-fg-dim mt-1 font-mono">{item.visualHook}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
