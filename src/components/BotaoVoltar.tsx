"use client";

import { useRouter } from "next/navigation";

// Usa o histórico do navegador (volta pro catálogo já com os filtros que o
// vendedor tinha aplicado) — útil sobretudo depois de abrir a ficha técnica
// (manual) num PDF externo e querer retornar pro app. Sem histórico prévio
// (ex.: link aberto direto), cai no fallback fixo.
export function BotaoVoltar({ fallbackHref }: { fallbackHref: string }) {
  const router = useRouter();

  function voltar() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={voltar}
      className="flex w-fit items-center gap-1 text-sm font-medium text-[var(--color-azul-prix)]"
    >
      ← Voltar
    </button>
  );
}
