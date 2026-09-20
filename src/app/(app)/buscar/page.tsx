"use client";

import { useState } from "react";

interface Mensagem {
  autor: "vendedor" | "agente";
  texto: string;
}

export default function BuscarPage() {
  const [pergunta, setPergunta] = useState("");
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    const texto = pergunta.trim();
    if (!texto || enviando) return;

    setMensagens((atual) => [...atual, { autor: "vendedor", texto }]);
    setPergunta("");
    setEnviando(true);

    try {
      const resposta = await fetch("/api/agente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: texto }),
      });
      const dados = await resposta.json();
      setMensagens((atual) => [
        ...atual,
        {
          autor: "agente",
          texto: dados.resposta ?? dados.erro ?? "Não consegui responder agora.",
        },
      ]);
    } catch {
      setMensagens((atual) => [
        ...atual,
        { autor: "agente", texto: "Não consegui responder agora. Tente de novo." },
      ]);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-chumbo-prix)]">
          Buscar com IA
        </h1>
        <p className="text-sm text-[var(--color-chumbo-prix)]/70">
          Pergunte sobre modelos do catálogo Toledo. Se a informação não
          estiver cadastrada, o assistente diz que não sabe — nunca inventa.
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {mensagens.map((mensagem, indice) => (
          <div
            key={indice}
            className={
              mensagem.autor === "vendedor"
                ? "self-end rounded-md bg-[var(--color-azul-prix)] px-3 py-2 text-sm text-white"
                : "self-start rounded-md bg-gray-100 px-3 py-2 text-sm text-[var(--color-chumbo-prix)]"
            }
          >
            {mensagem.texto}
          </div>
        ))}
        {enviando && (
          <div className="self-start rounded-md bg-gray-100 px-3 py-2 text-sm text-[var(--color-chumbo-prix)]/60">
            Consultando o catálogo…
          </div>
        )}
      </div>

      <form onSubmit={enviar} className="flex gap-2">
        <input
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          placeholder="Ex.: quais as opções de comunicação da 2098 C?"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-[var(--color-azul-prix)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
