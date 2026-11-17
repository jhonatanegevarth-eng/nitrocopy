"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Email ou senha incorretos.");
      setLoading(false);
    } else {
      router.push("/native");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-[360px]">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <NitroLogo />
        </div>

        <div className="bg-bg-2 border border-border rounded-xl p-8">
          <h1 className="text-[20px] font-semibold text-fg mb-1">Entrar</h1>
          <p className="text-sm text-fg-muted mb-6">Acesse seu workspace.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-fg-muted mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                required
                className="w-full bg-input-bg border border-input-border rounded-lg px-3 py-2.5 text-[13.5px] text-fg placeholder:text-fg-dim outline-none focus:border-accent transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-fg-muted mb-1.5">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-input-bg border border-input-border rounded-lg px-3 py-2.5 text-[13.5px] text-fg placeholder:text-fg-dim outline-none focus:border-accent transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400 text-[12.5px]">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-60 text-black font-semibold rounded-lg py-2.5 text-[13.5px] transition-colors"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="text-center text-[12.5px] text-fg-muted mt-5">
            Não tem conta?{" "}
            <Link href="/register" className="text-accent hover:underline">
              Criar grátis
            </Link>
          </p>
        </div>

        <p className="text-center text-[11px] text-fg-dim mt-6">
          © 2026 NitroCopy · native · anúncios · VSLs, com IA
        </p>
      </div>
    </div>
  );
}

function NitroLogo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="26" height="26" viewBox="0 0 22 22" fill="none">
        <polygon points="11,1 21,6 21,16 11,21 1,16 1,6" fill="#1F51FF" opacity="0.15" stroke="#1F51FF" strokeWidth="1.5"/>
        <path d="M7 15V8l8 7V8" stroke="#1F51FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="text-fg font-semibold text-[17px] tracking-tight">NitroCopy</span>
    </div>
  );
}
