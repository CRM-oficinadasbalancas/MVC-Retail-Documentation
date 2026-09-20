"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function entrarComGoogle() {
    setErro(null);
    setCarregando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setErro("Não foi possível iniciar o login. Tente novamente.");
      setCarregando(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-2xl font-semibold text-[var(--color-chumbo-prix)]">
        Agente Comercial Toledo
      </h1>
      <p className="max-w-sm text-sm text-[var(--color-chumbo-prix)]/80">
        Acesso restrito a e-mails corporativos da Toledo.
      </p>
      <button
        type="button"
        onClick={entrarComGoogle}
        disabled={carregando}
        className="rounded-md bg-[var(--color-azul-prix)] px-6 py-3 font-medium text-white disabled:opacity-60"
      >
        {carregando ? "Redirecionando…" : "Entrar com Google"}
      </button>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
    </main>
  );
}
