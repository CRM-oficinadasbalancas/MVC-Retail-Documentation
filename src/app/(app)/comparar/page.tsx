"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RestricoesAlerta } from "@/components/RestricoesAlerta";
import type { Equipamento } from "@/types/equipamento";

type EquipamentoComparavel = Pick<
  Equipamento,
  | "id"
  | "modelo"
  | "linha"
  | "categoria"
  | "specs_tecnicas"
  | "restricoes_uso"
  | "url_ficha_tecnica"
>;

export default function CompararPage() {
  return (
    <Suspense>
      <CompararConteudo />
    </Suspense>
  );
}

function CompararConteudo() {
  const searchParams = useSearchParams();
  const destaque = searchParams.get("ids");

  const [equipamentos, setEquipamentos] = useState<EquipamentoComparavel[]>([]);
  const [selecionados, setSelecionados] = useState<Set<string>>(
    () => new Set(destaque ? destaque.split(",") : []),
  );
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("equipamentos")
      .select(
        "id, modelo, linha, categoria, specs_tecnicas, restricoes_uso, url_ficha_tecnica",
      )
      .order("linha")
      .order("modelo")
      .then(({ data, error }) => {
        if (error) {
          setErro("Não foi possível carregar o catálogo agora.");
        } else {
          setEquipamentos((data ?? []) as EquipamentoComparavel[]);
        }
        setCarregando(false);
      });
  }, []);

  function alternarSelecao(id: string) {
    setSelecionados((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  }

  const equipamentosSelecionados = useMemo(
    () => equipamentos.filter((e) => selecionados.has(e.id)),
    [equipamentos, selecionados],
  );

  const chavesSpecs = useMemo(() => {
    const chaves = new Set<string>();
    for (const e of equipamentosSelecionados) {
      Object.keys(e.specs_tecnicas ?? {}).forEach((chave) => chaves.add(chave));
    }
    return Array.from(chaves);
  }, [equipamentosSelecionados]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-[var(--color-chumbo-prix)]">
        Comparar modelos Toledo
      </h1>
      <p className="text-sm text-[var(--color-chumbo-prix)]/70">
        Selecione dois ou mais modelos do catálogo para comparar as
        especificações técnicas lado a lado.
      </p>

      {erro && <p className="text-sm text-red-600">{erro}</p>}
      {carregando && <p className="text-sm">Carregando catálogo…</p>}

      <div className="flex flex-wrap gap-2">
        {equipamentos.map((e) => (
          <label
            key={e.id}
            className={`cursor-pointer rounded-md border px-3 py-2 text-sm ${
              selecionados.has(e.id)
                ? "border-[var(--color-azul-prix)] bg-[var(--color-azul-prix)]/10"
                : "border-gray-300"
            }`}
          >
            <input
              type="checkbox"
              className="mr-2"
              checked={selecionados.has(e.id)}
              onChange={() => alternarSelecao(e.id)}
            />
            {e.linha} · {e.modelo}
          </label>
        ))}
      </div>

      {equipamentosSelecionados.length > 0 && (
        <div className="flex flex-col gap-3">
          {equipamentosSelecionados.map((e) => (
            <RestricoesAlerta key={e.id} restricoes={e.restricoes_uso} />
          ))}
        </div>
      )}

      {equipamentosSelecionados.length >= 2 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left text-[var(--color-chumbo-prix)]/60">
                  Especificação
                </th>
                {equipamentosSelecionados.map((e) => (
                  <th
                    key={e.id}
                    className="p-2 text-left font-semibold text-[var(--color-chumbo-prix)]"
                  >
                    {e.modelo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chavesSpecs.map((chave) => (
                <tr key={chave} className="border-t border-gray-100">
                  <td className="p-2 font-medium capitalize text-[var(--color-chumbo-prix)]">
                    {chave.replaceAll("_", " ")}
                  </td>
                  {equipamentosSelecionados.map((e) => {
                    const valor = e.specs_tecnicas?.[chave];
                    return (
                      <td key={e.id} className="p-2 text-[var(--color-chumbo-prix)]/90">
                        {valor == null
                          ? "—"
                          : Array.isArray(valor)
                            ? valor.join(", ")
                            : String(valor)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <GerarApresentacaoButton ids={equipamentosSelecionados.map((e) => e.id)} />
        </div>
      )}
    </div>
  );
}

function GerarApresentacaoButton({ ids }: { ids: string[] }) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function gerar() {
    setErro(null);
    setGerando(true);
    try {
      const resposta = await fetch("/api/apresentacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!resposta.ok) throw new Error("Falha ao gerar apresentação");
      const blob = await resposta.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "apresentacao-toledo.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setErro("Não foi possível gerar a apresentação agora.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="mt-4 flex items-center gap-3">
      <button
        type="button"
        onClick={gerar}
        disabled={gerando}
        className="rounded-md bg-[var(--color-azul-prix)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {gerando ? "Gerando…" : "Gerar apresentação (PDF)"}
      </button>
      {erro && <span className="text-sm text-red-600">{erro}</span>}
    </div>
  );
}
