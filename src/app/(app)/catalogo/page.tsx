import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Equipamento, LinhaNegocio } from "@/types/equipamento";

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ linha?: string; categoria?: string }>;
}) {
  const { linha, categoria } = await searchParams;
  const supabase = await createClient();

  const { data: linhas } = await supabase
    .from("linhas_negocio")
    .select("codigo, nome")
    .order("codigo");

  let query = supabase
    .from("equipamentos")
    .select(
      "id, modelo, linha, categoria, descricao_curta, restricoes_uso, status",
    )
    .order("modelo");

  if (linha) query = query.eq("linha", linha);
  if (categoria) query = query.eq("categoria", categoria);

  const { data: equipamentos, error } = await query;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-[var(--color-chumbo-prix)]">
        Catálogo
      </h1>

      <FiltroLinha
        linhas={linhas ?? []}
        linhaSelecionada={linha}
        categoriaSelecionada={categoria}
      />

      {error && (
        <p className="text-sm text-red-600">
          Não foi possível carregar o catálogo agora. Tente novamente.
        </p>
      )}

      {!error && equipamentos?.length === 0 && (
        <p className="text-sm text-[var(--color-chumbo-prix)]/70">
          Nenhum equipamento revisado encontrado para esse filtro.
        </p>
      )}

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {equipamentos?.map((equipamento) => (
          <EquipamentoCard key={equipamento.id} equipamento={equipamento} />
        ))}
      </ul>
    </div>
  );
}

function FiltroLinha({
  linhas,
  linhaSelecionada,
  categoriaSelecionada,
}: {
  linhas: LinhaNegocio[];
  linhaSelecionada?: string;
  categoriaSelecionada?: string;
}) {
  return (
    <form className="flex flex-wrap gap-2" method="get">
      <select
        name="linha"
        defaultValue={linhaSelecionada ?? ""}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="">Todas as linhas</option>
        {linhas.map((l) => (
          <option key={l.codigo} value={l.codigo}>
            {l.codigo} — {l.nome}
          </option>
        ))}
      </select>
      {categoriaSelecionada && (
        <input type="hidden" name="categoria" value={categoriaSelecionada} />
      )}
      <button
        type="submit"
        className="rounded-md bg-[var(--color-azul-prix)] px-4 py-2 text-sm font-medium text-white"
      >
        Filtrar
      </button>
    </form>
  );
}

function EquipamentoCard({
  equipamento,
}: {
  equipamento: Pick<
    Equipamento,
    "id" | "modelo" | "linha" | "categoria" | "descricao_curta" | "restricoes_uso"
  >;
}) {
  return (
    <li className="rounded-md border border-gray-200 p-4">
      <Link href={`/catalogo/${equipamento.id}`} className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[var(--color-azul-prix)]">
          {equipamento.linha}
          {equipamento.categoria ? ` · ${equipamento.categoria}` : ""}
        </span>
        <span className="font-semibold text-[var(--color-chumbo-prix)]">
          {equipamento.modelo}
        </span>
        {equipamento.descricao_curta && (
          <span className="text-sm text-[var(--color-chumbo-prix)]/80">
            {equipamento.descricao_curta}
          </span>
        )}
        {equipamento.restricoes_uso && (
          <span className="mt-1 text-xs font-medium text-amber-700">
            ⚠ Tem restrição de uso
          </span>
        )}
      </Link>
    </li>
  );
}
