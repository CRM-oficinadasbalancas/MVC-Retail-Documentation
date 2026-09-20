"use client";

import { useState } from "react";

// Vídeos e fotos são pra mandar pro cliente, não pra assistir dentro do app —
// por isso share (Web Share API no mobile) em vez de player/preview embutido.
// Sem Web Share (ex.: desktop), cai pra copiar o link.
export function CompartilharBotao({
  url,
  titulo,
}: {
  url: string;
  titulo: string;
}) {
  const [status, setStatus] = useState<string | null>(null);

  async function compartilhar() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: titulo, url });
        return;
      } catch {
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setStatus("Link copiado!");
    } catch {
      setStatus("Não foi possível copiar o link.");
    } finally {
      setTimeout(() => setStatus(null), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={compartilhar}
      className="w-fit rounded-md border border-[var(--color-azul-prix)] px-3 py-1.5 text-xs font-medium text-[var(--color-azul-prix)]"
    >
      {status ?? "Compartilhar"}
    </button>
  );
}
