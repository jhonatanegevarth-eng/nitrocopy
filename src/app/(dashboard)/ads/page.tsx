"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import type { AdsMode, AdsItem } from "@/lib/prompts/ads";

const MODES: { id: AdsMode; label: string; desc: string }[] = [
  { id: "generate", label: "Generate", desc: "Clona a fórmula" },
  { id: "transmute", label: "Transmute", desc: "Reescreve do zero" },
  { id: "sexy", label: "Sexy", desc: "Versão agressiva" },
];

const LAYERS = [
  { key: "hook", label: "Gancho" },
  { key: "body", label: "Corpo" },
  { key: "cta", label: "CTA" },
  { key: "psychology", label: "Psicologia" },
  { key: "scenes", label: "Cenas" },
  { key: "rhythm", label: "Ritmo" },
  { key: "triggers", label: "Gatilhos" },
];

export default function AdsPage() {
  const [niche, setNiche] = useState("");
  const [mechanism, setMechanism] = useState("");
  const [mode, setMode] = useState<AdsMode>("generate");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<AdsItem[]>([]);
  const [activeItem, setActiveItem] = useState(0);
  const [view, setView] = useState<"full" | "layers">("full");

  async function handleGenerate() {
    setError("");
    setLoading(true);
    setResults([]);

    try {
      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, mechanism, mode, quantity, trainingExamples: [] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro na geração");
      setResults(data.items ?? []);
      setActiveItem(0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  const current = results[activeItem];

  return (
    <div className="flex h-full">
      {/* Left panel */}
      <div className="w-[280px] min-h-full border-r border-border flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-border">
          <h1 className="text-[15px] font-semibold text-fg">Criador de Ads</h1>
          <p className="text-[12.5px] text-fg-muted mt-0.5">7 camadas · inglês (US)</p>
        </div>

        <div className="p-5 flex-1 space-y-5 overflow-y-auto">
          {/* Modes */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-widest text-fg-muted">
              Modo
            </label>
            <div className="space-y-1.5">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-colors",
                    mode === m.id
                      ? "bg-accent-surface border-accent"
                      : "bg-bg-3 border-border hover:bg-bg-2"
                  )}
                >
                  <span className={cn("text-[13px] font-medium", mode === m.id ? "text-accent" : "text-fg")}>
                    {m.label}
                  </span>
                  <span className="text-[11.5px] text-fg-muted">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Nicho"
            placeholder="ex: saúde metabólica"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
          />

          <Textarea
            label="Mecanismo central"
            placeholder="ex: O ácido úrico bloqueia a queima de gordura..."
            value={mechanism}
            onChange={(e) => setMechanism(e.target.value)}
            rows={3}
          />

          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-widest text-fg-muted">
              Quantidade
            </label>
            <div className="flex gap-2">
              {[1, 2, 3].map((n) => (
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
            disabled={!niche.trim() || !mechanism.trim()}
          >
            {loading ? "Gerando..." : "Gerar"}
          </Button>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 overflow-y-auto">
        {!current && !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="text-fg-dim text-4xl mb-4">📣</div>
            <p className="text-fg-muted text-[13.5px] max-w-xs">
              Escolha o modo, preencha o nicho e o mecanismo, depois clique em{" "}
              <span className="text-fg font-medium">Gerar</span>.
            </p>
          </div>
        ) : current ? (
          <div className="p-5">
            {/* Item selector */}
            {results.length > 1 && (
              <div className="flex gap-1.5 mb-4">
                {results.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveItem(i)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[12px] border transition-colors",
                      activeItem === i
                        ? "bg-accent-surface border-accent text-accent"
                        : "bg-bg-3 border-border text-fg-muted hover:text-fg"
                    )}
                  >
                    Versão {i + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Angle badge */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10.5px] font-mono text-fg-dim bg-bg-3 px-2.5 py-1 rounded-md border border-border">
                Ângulo: {current.angle}
              </span>
              <div className="flex gap-1 bg-bg-3 rounded-lg p-0.5">
                {(["full", "layers"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-[12px] transition-colors",
                      view === v ? "bg-bg-2 text-fg" : "text-fg-muted"
                    )}
                  >
                    {v === "full" ? "Copy completa" : "7 Camadas"}
                  </button>
                ))}
              </div>
            </div>

            {view === "full" ? (
              <div className="bg-bg-2 border border-border rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono text-fg-dim uppercase tracking-widest">Copy completa</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(current.fullCopy).catch(() => {})}
                    className="text-[12px] text-fg-muted hover:text-fg flex items-center gap-1.5 transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M1 9V2a1 1 0 0 1 1-1h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    Copiar
                  </button>
                </div>
                <p className="text-[13.5px] text-fg leading-relaxed whitespace-pre-wrap">{current.fullCopy}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {LAYERS.map(({ key, label }) => (
                  <div key={key} className="bg-bg-2 border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10.5px] font-mono text-accent uppercase tracking-widest">{label}</span>
                    </div>
                    <p className="text-[13px] text-fg-muted leading-relaxed">
                      {(current.layers as unknown as Record<string, string>)[key]}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
