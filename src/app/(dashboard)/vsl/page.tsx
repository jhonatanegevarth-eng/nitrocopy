"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { MARKETS, AGENTS } from "@/lib/prompts/vsl";
import { cn } from "@/lib/utils";
import type { VSLOutput } from "@/lib/prompts/vsl";

const AGENT_SECTIONS = [
  { key: "strategy", label: "Estrategista", num: "01" },
  { key: "psychology", label: "Psicólogo", num: "02" },
  { key: "mechanism", label: "Mecanicista", num: "03" },
  { key: "bigIdea", label: "Big Ideia", num: "04" },
  { key: "story", label: "Storyteller", num: "05" },
  { key: "logic", label: "Lógico", num: "06" },
  { key: "close", label: "Fechador", num: "07" },
];

export default function VSLPage() {
  const [niche, setNiche] = useState("");
  const [mechanism, setMechanism] = useState("");
  const [market, setMarket] = useState(MARKETS[0]);
  const [splitTestLeads, setSplitTestLeads] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<VSLOutput | null>(null);
  const [activeView, setActiveView] = useState<"full" | "agents" | "leads">("full");
  const [activeLead, setActiveLead] = useState(0);

  async function handleGenerate() {
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/vsl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche,
          mechanism,
          market,
          splitTestLeads,
          trainingExamples: [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro na geração");
      setResult(data);
      setActiveView("full");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full">
      {/* Left panel */}
      <div className="w-[280px] min-h-full border-r border-border flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-border">
          <h1 className="text-[15px] font-semibold text-fg">Criador de VSL</h1>
          <p className="text-[12.5px] text-fg-muted mt-0.5">7 agentes · Puzzle Pieces</p>
        </div>

        <div className="p-5 flex-1 space-y-5 overflow-y-auto">
          {/* Agent pipeline visual */}
          <div className="bg-bg-3 border border-border rounded-lg p-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-fg-dim mb-2">Pipeline</p>
            <div className="flex gap-1 flex-wrap">
              {AGENTS.map((a, i) => (
                <span
                  key={i}
                  className={cn(
                    "text-[10px] font-mono px-1.5 py-0.5 rounded",
                    loading ? "bg-accent-surface text-accent animate-pulse" : "bg-bg-2 text-fg-dim border border-border"
                  )}
                >
                  {a.name}
                </span>
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
              Mercado
            </label>
            <div className="space-y-1">
              {MARKETS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMarket(m)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg border text-[12px] transition-colors",
                    market === m
                      ? "bg-accent-surface border-accent text-accent"
                      : "bg-bg-3 border-border text-fg-muted hover:text-fg"
                  )}
                >
                  {m.split(" — ")[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-widest text-fg-muted">
              Leads split-test
            </label>
            <div className="flex gap-2">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => setSplitTestLeads(n)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-[12.5px] border transition-colors",
                    splitTestLeads === n
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
          {loading && (
            <p className="text-[11.5px] text-fg-muted text-center mb-3">
              Rodando 7 agentes... pode levar 1-2 min
            </p>
          )}
          <Button
            className="w-full"
            onClick={handleGenerate}
            loading={loading}
            disabled={!niche.trim() || !mechanism.trim()}
          >
            {loading ? "Gerando VSL..." : "Gerar VSL"}
          </Button>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 overflow-y-auto">
        {!result && !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="text-fg-dim text-4xl mb-4">🎬</div>
            <p className="text-fg-muted text-[13.5px] max-w-sm">
              Preencha o nicho, o mecanismo e selecione o mercado. O método{" "}
              <span className="text-fg font-medium">Puzzle Pieces</span> vai rodar 7 agentes em sequência para montar sua VSL completa.
            </p>
          </div>
        ) : result ? (
          <div className="p-5">
            {/* View selector */}
            <div className="flex gap-1 bg-bg-3 rounded-lg p-0.5 mb-5 w-fit">
              {([
                { id: "full", label: "Script completo" },
                { id: "agents", label: "7 Agentes" },
                { id: "leads", label: `Leads (${result.leads.length})` },
              ] as const).map((v) => (
                <button
                  key={v.id}
                  onClick={() => setActiveView(v.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[12.5px] transition-colors whitespace-nowrap",
                    activeView === v.id ? "bg-bg-2 text-fg" : "text-fg-muted hover:text-fg"
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {activeView === "full" && (
              <div className="bg-bg-2 border border-border rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono text-fg-dim uppercase tracking-widest">Script completo</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(result.fullScript).catch(() => {})}
                    className="text-[12px] text-fg-muted hover:text-fg flex items-center gap-1.5 transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M1 9V2a1 1 0 0 1 1-1h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    Copiar
                  </button>
                </div>
                <p className="text-[13.5px] text-fg leading-relaxed whitespace-pre-wrap">{result.fullScript}</p>
              </div>
            )}

            {activeView === "agents" && (
              <div className="space-y-3">
                {AGENT_SECTIONS.map(({ key, label, num }) => (
                  <div key={key} className="bg-bg-2 border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-mono text-[10px] text-accent">{num}</span>
                      <span className="text-[13px] font-semibold text-fg">{label}</span>
                    </div>
                    <p className="text-[13px] text-fg-muted leading-relaxed whitespace-pre-wrap">
                      {(result as unknown as Record<string, unknown>)[key] as string}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {activeView === "leads" && (
              <div>
                {result.leads.length > 1 && (
                  <div className="flex gap-1.5 mb-4">
                    {result.leads.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveLead(i)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[12px] border transition-colors",
                          activeLead === i
                            ? "bg-accent-surface border-accent text-accent"
                            : "bg-bg-3 border-border text-fg-muted hover:text-fg"
                        )}
                      >
                        Lead {i + 1}
                      </button>
                    ))}
                  </div>
                )}
                {result.leads[activeLead] && (
                  <div className="bg-bg-2 border border-border rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-mono text-fg-dim uppercase tracking-widest">
                        Lead {activeLead + 1} — gancho para split-test
                      </span>
                      <button
                        onClick={() => navigator.clipboard.writeText(result.leads[activeLead].hook).catch(() => {})}
                        className="text-[12px] text-fg-muted hover:text-fg flex items-center gap-1.5 transition-colors"
                      >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                          <path d="M1 9V2a1 1 0 0 1 1-1h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                        Copiar
                      </button>
                    </div>
                    <p className="text-[13.5px] text-fg leading-relaxed whitespace-pre-wrap">
                      {result.leads[activeLead].hook}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
