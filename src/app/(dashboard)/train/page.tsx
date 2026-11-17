"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

type Tool = "native" | "ads" | "vsl";

interface Entry {
  id: string;
  tool: Tool;
  content: string;
  label: string | null;
  created_at: string;
}

const TOOL_LABELS: Record<Tool, string> = {
  native: "Native",
  ads: "Ads",
  vsl: "VSL",
};

const DNA_LABEL = "__dna__";

export default function TrainPage() {
  const supabase = createClient();
  const [tool, setTool] = useState<Tool>("ads");
  const [content, setContent] = useState("");
  const [label, setLabel] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingDna, setGeneratingDna] = useState(false);
  const [dnaStatus, setDnaStatus] = useState<"idle" | "done" | "error">("idle");
  const [dnaProfile, setDnaProfile] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("training_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setEntries((data as Entry[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("training_entries").insert({
      user_id: user.id,
      tool,
      content: content.trim(),
      label: label.trim() || null,
    });
    setContent("");
    setLabel("");
    await fetchEntries();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await supabase.from("training_entries").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setDnaProfile(null);
    setDnaStatus("idle");
  }

  async function handleGenerateDna() {
    setGeneratingDna(true);
    setDnaStatus("idle");
    setDnaProfile(null);
    try {
      const res = await fetch("/api/train/dna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Erro ao gerar DNA");
      }
      const d = await res.json();
      setDnaProfile(d.dna as string);
      setDnaStatus("done");
      await fetchEntries();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar DNA";
      setDnaProfile(msg);
      setDnaStatus("error");
    } finally {
      setGeneratingDna(false);
    }
  }

  const filtered = entries.filter((e) => e.tool === tool && e.label !== DNA_LABEL);
  const currentDna = entries.find((e) => e.tool === tool && e.label === DNA_LABEL);

  return (
    <div className="flex h-full">
      {/* Left — add training */}
      <div className="w-[320px] min-h-full border-r border-border flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-border">
          <h1 className="text-[15px] font-semibold text-fg">Treino</h1>
          <p className="text-[12.5px] text-fg-muted mt-0.5">Cole seus criativos vencedores</p>
        </div>

        <div className="p-5 flex-1 space-y-4">
          {/* Tool selector */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-widest text-fg-muted">
              Ferramenta
            </label>
            <div className="flex gap-1.5">
              {(["native", "ads", "vsl"] as Tool[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTool(t); setDnaStatus("idle"); setDnaProfile(null); }}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-[12.5px] border transition-colors",
                    tool === t
                      ? "bg-accent-surface border-accent text-accent"
                      : "bg-bg-3 border-border text-fg-muted hover:text-fg"
                  )}
                >
                  {TOOL_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-widest text-fg-muted">
              Rótulo (opcional)
            </label>
            <input
              placeholder="ex: Ads de pressão arterial — Q1 2025"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-input-bg border border-input-border rounded-lg px-3 py-2 text-[13px] text-fg placeholder:text-fg-dim outline-none focus:border-accent transition-colors"
            />
          </div>

          <Textarea
            label={`Conteúdo (${TOOL_LABELS[tool]})`}
            placeholder={
              tool === "vsl"
                ? "Cole o roteiro completo da VSL..."
                : tool === "ads"
                ? "Cole o anúncio completo (copy pronta para voiceover)..."
                : "Cole a headline e descrição do anúncio nativo..."
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
          />
        </div>

        <div className="p-5 border-t border-border space-y-2">
          <Button
            className="w-full"
            onClick={handleSave}
            loading={saving}
            disabled={!content.trim()}
          >
            Salvar no DNA
          </Button>
          <button
            onClick={handleGenerateDna}
            disabled={generatingDna || filtered.length < 2}
            className={cn(
              "w-full py-2.5 rounded-lg text-[12.5px] border transition-colors",
              filtered.length >= 2
                ? "bg-accent-surface border-accent text-accent-text hover:bg-accent/10"
                : "bg-bg-3 border-border text-fg-dim cursor-not-allowed opacity-50"
            )}
          >
            {generatingDna ? "Gerando DNA..." : `Extrair DNA (${filtered.length} exemplo${filtered.length !== 1 ? "s" : ""})`}
          </button>
          {filtered.length < 2 && (
            <p className="text-[11px] text-fg-dim text-center">
              Adicione pelo menos 2 exemplos para extrair o DNA.
            </p>
          )}
        </div>
      </div>

      {/* Right — list + DNA */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex gap-1 bg-bg-3 rounded-lg p-0.5">
            {(["native", "ads", "vsl"] as Tool[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTool(t); setDnaStatus("idle"); setDnaProfile(null); }}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[12.5px] transition-colors",
                  tool === t ? "bg-bg-2 text-fg" : "text-fg-muted hover:text-fg"
                )}
              >
                {TOOL_LABELS[t]}
              </button>
            ))}
          </div>
          <span className="text-[12px] text-fg-dim">{filtered.length} exemplo(s)</span>
        </div>

        {/* DNA result or saved DNA */}
        {(dnaStatus !== "idle" || currentDna) && (
          <div
            className={cn(
              "rounded-xl border p-4 mb-4",
              dnaStatus === "error"
                ? "bg-red-400/5 border-red-400/20"
                : "bg-accent-surface border-accent/30"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-accent-text">
                DNA {TOOL_LABELS[tool]}
              </span>
              {currentDna && dnaStatus === "idle" && (
                <span className="text-[10px] text-fg-dim">
                  (salvo {new Date(currentDna.created_at).toLocaleDateString("pt-BR")})
                </span>
              )}
            </div>
            <p className="text-[12.5px] text-fg-muted whitespace-pre-wrap leading-relaxed">
              {dnaStatus !== "idle" ? dnaProfile : currentDna?.content}
            </p>
          </div>
        )}

        {loading ? (
          <div className="text-fg-muted text-[13px]">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-fg-dim text-[13px]">
            Nenhum exemplo de {TOOL_LABELS[tool]} ainda. Cole seus criativos vencedores para treinar o DNA.
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((entry) => (
              <div key={entry.id} className="bg-bg-2 border border-border rounded-lg p-4 group">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    {entry.label && (
                      <span className="text-[11px] font-mono text-accent bg-accent-surface px-2 py-0.5 rounded mr-2">
                        {entry.label}
                      </span>
                    )}
                    <span className="text-[10.5px] text-fg-dim">
                      {new Date(entry.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-fg-dim hover:text-red-400"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 3.5h10M5 3.5V2h4v1.5M5.5 6v4.5M8.5 6v4.5M3 3.5l.5 8a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1l.5-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                <p className="text-[12.5px] text-fg-muted line-clamp-3 leading-relaxed">
                  {entry.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
