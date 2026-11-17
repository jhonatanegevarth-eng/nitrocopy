"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Tool = "native" | "ads" | "vsl";

interface Generation {
  id: string;
  tool: Tool;
  mode: string | null;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  created_at: string;
}

const TOOL_LABELS: Record<Tool, string> = {
  native: "Native",
  ads: "Ads",
  vsl: "VSL",
};

export default function HistoryPage() {
  const supabase = createClient();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Tool | "all">("all");
  const [selected, setSelected] = useState<Generation | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("generations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setGenerations((data as Generation[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = filter === "all" ? generations : generations.filter((g) => g.tool === filter);

  function getPreview(g: Generation): string {
    if (g.tool === "native") {
      const items = (g.output.items as { headline: string }[] | undefined) ?? [];
      return items[0]?.headline ?? "—";
    }
    if (g.tool === "ads") {
      const items = (g.output.items as { fullCopy: string }[] | undefined) ?? [];
      return items[0]?.fullCopy?.slice(0, 100) ?? "—";
    }
    return (g.output.fullScript as string | undefined)?.slice(0, 100) ?? "—";
  }

  return (
    <div className="flex h-full">
      <div className="w-[340px] border-r border-border flex flex-col">
        <div className="p-5 border-b border-border">
          <h1 className="text-[15px] font-semibold text-fg">Histórico</h1>
          <div className="flex gap-1 mt-3 bg-bg-3 rounded-lg p-0.5 w-fit">
            {(["all", "native", "ads", "vsl"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1 rounded-md text-[12px] transition-colors",
                  filter === f ? "bg-bg-2 text-fg" : "text-fg-muted hover:text-fg"
                )}
              >
                {f === "all" ? "Todos" : TOOL_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-5 text-fg-muted text-[13px]">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-5 text-fg-dim text-[13px] text-center py-12">Nenhuma geração ainda.</div>
          ) : (
            filtered.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelected(g)}
                className={cn(
                  "w-full text-left px-5 py-4 border-b border-border transition-colors",
                  selected?.id === g.id ? "bg-accent-surface" : "hover:bg-bg-3"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "text-[10px] font-mono px-1.5 py-0.5 rounded",
                    g.tool === "native" ? "bg-blue-900/50 text-blue-300" :
                    g.tool === "ads" ? "bg-purple-900/50 text-purple-300" :
                    "bg-orange-900/50 text-orange-300"
                  )}>
                    {TOOL_LABELS[g.tool]}
                  </span>
                  {g.mode && (
                    <span className="text-[10px] font-mono text-fg-dim">{g.mode}</span>
                  )}
                  <span className="text-[10px] text-fg-dim ml-auto">
                    {new Date(g.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <p className="text-[12.5px] text-fg-muted line-clamp-2">{getPreview(g)}</p>
                <p className="text-[11px] text-fg-dim mt-1">
                  {(g.input.niche as string) ?? ""} {g.input.angle ? `· ${g.input.angle}` : ""}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-fg-dim text-[13px]">
            Selecione uma geração para visualizar
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-[12px] font-mono text-fg-dim uppercase tracking-widest">
                {TOOL_LABELS[selected.tool]} · {new Date(selected.created_at).toLocaleString("pt-BR")}
              </span>
              <button
                onClick={() => {
                  const text = JSON.stringify(selected.output, null, 2);
                  navigator.clipboard.writeText(text).catch(() => {});
                }}
                className="ml-auto text-[12px] text-fg-muted hover:text-fg transition-colors"
              >
                Copiar JSON
              </button>
            </div>
            <pre className="bg-bg-2 border border-border rounded-lg p-4 text-[12px] text-fg-muted overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(selected.output, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
