"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

type Provider = "openai" | "venice";

interface SettingsData {
  hasKey: boolean;
  maskedKey: string;
  provider: Provider;
  veniceBalance: number | null;
}

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState<Provider>("openai");
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshingBalance, setRefreshingBalance] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d: SettingsData) => {
        setSettings(d);
        setProvider(d.provider ?? "openai");
      })
      .catch(() => {});
  }, []);

  async function handleSave() {
    if (!apiKey.trim() && provider === settings?.provider) return;
    setSaving(true);
    setStatus("idle");
    try {
      const body: Record<string, string> = { ai_provider: provider };
      if (apiKey.trim()) body.api_key = apiKey.trim();

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setSettings((prev) => prev ? { ...prev, maskedKey: d.maskedKey ?? prev.maskedKey, provider, hasKey: true } : null);
      setApiKey("");
      setStatus("saved");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  async function refreshBalance() {
    setRefreshingBalance(true);
    try {
      const res = await fetch("/api/settings/balance");
      const d = await res.json();
      setSettings((prev) => prev ? { ...prev, veniceBalance: d.balance } : null);
    } catch {
      // silent
    } finally {
      setRefreshingBalance(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto p-8">
      <h1 className="text-[18px] font-semibold text-fg mb-1">Configurações</h1>
      <p className="text-[13px] text-fg-muted mb-8">Chave de API e provedor de IA.</p>

      {/* Provider selector */}
      <div className="bg-bg-2 border border-border rounded-xl p-6 mb-4">
        <p className="text-[11px] font-mono uppercase tracking-widest text-fg-muted mb-3">
          Provedor de IA
        </p>
        <div className="flex gap-2">
          {(["openai", "venice"] as Provider[]).map((p) => (
            <button
              key={p}
              onClick={() => setProvider(p)}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-[13px] border transition-colors",
                provider === p
                  ? "bg-accent-surface border-accent text-accent-text"
                  : "bg-bg-3 border-border text-fg-muted hover:text-fg"
              )}
            >
              {p === "openai" ? "OpenAI" : "Venice AI"}
            </button>
          ))}
        </div>
        {provider === "venice" && (
          <p className="text-[11.5px] text-fg-dim mt-2">
            Compatível com OpenAI. Use sua chave Venice. Sem timeout de serverless.
          </p>
        )}
      </div>

      {/* API key */}
      <div className="bg-bg-2 border border-border rounded-xl p-6 mb-4 space-y-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-fg-muted mb-3">
            Chave de API
          </p>
          {settings?.maskedKey && (
            <div className="flex items-center gap-2 mb-3 bg-bg-3 border border-border rounded-lg px-3 py-2">
              <span className="text-[11px] text-fg-dim font-mono">Chave atual:</span>
              <span className="text-[12px] text-fg font-mono">{settings.maskedKey}</span>
            </div>
          )}
          <Input
            label={provider === "venice" ? "Chave Venice (sk-...)" : "Chave OpenAI (sk-...)"}
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => { setApiKey(e.target.value); setStatus("idle"); }}
          />
          <p className="text-[11.5px] text-fg-dim mt-2">
            A chave fica no servidor — nunca exposta no browser.
          </p>
        </div>

        {status === "saved" && (
          <div className="text-[12.5px] text-accent-text bg-accent-surface border border-accent/30 rounded-lg px-3 py-2">
            Configurações salvas.
          </div>
        )}
        {status === "error" && (
          <div className="text-[12.5px] text-red-400 bg-red-400/5 border border-red-400/20 rounded-lg px-3 py-2">
            Erro ao salvar. Tente novamente.
          </div>
        )}

        <Button onClick={handleSave} loading={saving} disabled={!apiKey.trim() && provider === settings?.provider}>
          Salvar configurações
        </Button>
      </div>

      {/* Venice balance */}
      {provider === "venice" && (
        <div className="bg-bg-2 border border-border rounded-xl p-6 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-mono uppercase tracking-widest text-fg-muted">
              Saldo Venice
            </p>
            <button
              onClick={refreshBalance}
              disabled={refreshingBalance}
              className="text-[12px] text-fg-muted hover:text-fg transition-colors disabled:opacity-50"
            >
              {refreshingBalance ? "Atualizando..." : "Atualizar"}
            </button>
          </div>
          {settings?.veniceBalance != null ? (
            <p className="text-[22px] font-semibold text-fg">
              ${settings.veniceBalance.toFixed(4)}
              <span className="text-[13px] text-fg-muted font-normal ml-1">USD</span>
            </p>
          ) : (
            <p className="text-[13px] text-fg-dim">
              Salve uma chave Venice e clique em Atualizar.
            </p>
          )}
        </div>
      )}

      {/* How to get key */}
      <div className="bg-bg-2 border border-border rounded-xl p-6">
        <p className="text-[11px] font-mono uppercase tracking-widest text-fg-muted mb-3">
          {provider === "venice" ? "Como obter chave Venice" : "Como obter chave OpenAI"}
        </p>
        {provider === "openai" ? (
          <ol className="text-[12.5px] text-fg-muted space-y-1.5 list-decimal list-inside">
            <li>Acesse <span className="text-fg font-mono">platform.openai.com</span></li>
            <li>Vá em <span className="text-fg">API Keys</span> no menu esquerdo</li>
            <li>Clique em <span className="text-fg">Create new secret key</span></li>
            <li>Copie e configure aqui — ela só é exibida uma vez</li>
          </ol>
        ) : (
          <ol className="text-[12.5px] text-fg-muted space-y-1.5 list-decimal list-inside">
            <li>Acesse <span className="text-fg font-mono">venice.ai</span></li>
            <li>Vá em <span className="text-fg">Settings → API Keys</span></li>
            <li>Crie uma chave nova e copie aqui</li>
            <li>Adicione créditos em <span className="text-fg">Billing</span></li>
          </ol>
        )}
        <p className="text-[11.5px] text-fg-dim mt-3">
          Modelos: <span className="font-mono">{provider === "openai" ? "gpt-4o + dall-e-3" : "llama-3.3-70b + fluently-xl"}</span>
        </p>
      </div>
    </div>
  );
}
