import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RestricoesAlerta } from "@/components/RestricoesAlerta";
import type { SpecsTecnicas } from "@/types/equipamento";

export default async function EquipamentoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: equipamento } = await supabase
    .from("equipamentos")
    .select(
      "id, modelo, linha, categoria, descricao_curta, specs_tecnicas, restricoes_uso, url_ficha_tecnica, fonte, revisado_por, revisado_em",
    )
    .eq("id", id)
    .maybeSingle();

  if (!equipamento) notFound();

  const { data: imagens } = await supabase
    .from("imagens_equipamento")
    .select("id, url_webp, url_jpg_fallback, tipo")
    .eq("equipamento_id", id)
    .order("ordem");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className="text-xs font-medium text-[var(--color-azul-prix)]">
          {equipamento.linha}
          {equipamento.categoria ? ` · ${equipamento.categoria}` : ""}
        </span>
        <h1 className="text-2xl font-semibold text-[var(--color-chumbo-prix)]">
          {equipamento.modelo}
        </h1>
        {equipamento.descricao_curta && (
          <p className="text-[var(--color-chumbo-prix)]/80">
            {equipamento.descricao_curta}
          </p>
        )}
      </div>

      <RestricoesAlerta restricoes={equipamento.restricoes_uso} />

      {imagens && imagens.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {imagens.map((imagem) => (
            <picture key={imagem.id}>
              <source srcSet={imagem.url_webp} type="image/webp" />
              <img
                src={imagem.url_jpg_fallback}
                alt={equipamento.modelo}
                className="h-40 w-40 rounded-md object-cover"
              />
            </picture>
          ))}
        </div>
      )}

      <SpecsTable specs={equipamento.specs_tecnicas as SpecsTecnicas} />

      {equipamento.url_ficha_tecnica && (
        <a
          href={equipamento.url_ficha_tecnica}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-[var(--color-azul-prix)] underline"
        >
          Ver ficha técnica completa (todas as variantes/códigos de venda)
        </a>
      )}

      <p className="text-xs text-[var(--color-chumbo-prix)]/60">
        Fonte: {equipamento.fonte}
        {equipamento.revisado_por && ` · Revisado por ${equipamento.revisado_por}`}
        {equipamento.revisado_em &&
          ` em ${new Date(equipamento.revisado_em).toLocaleDateString("pt-BR")}`}
      </p>

      <Link
        href={`/comparar?ids=${equipamento.id}`}
        className="w-fit rounded-md border border-[var(--color-azul-prix)] px-4 py-2 text-sm font-medium text-[var(--color-azul-prix)]"
      >
        Adicionar à comparação
      </Link>
    </div>
  );
}

function SpecsTable({ specs }: { specs: SpecsTecnicas }) {
  const entradas = Object.entries(specs ?? {});
  if (entradas.length === 0) {
    return (
      <p className="text-sm text-[var(--color-chumbo-prix)]/70">
        Nenhuma especificação técnica cadastrada para este modelo ainda.
      </p>
    );
  }

  return (
    <table className="w-full text-sm">
      <tbody>
        {entradas.map(([chave, valor]) => (
          <tr key={chave} className="border-b border-gray-100">
            <td className="py-2 pr-4 font-medium text-[var(--color-chumbo-prix)] capitalize">
              {chave.replaceAll("_", " ")}
            </td>
            <td className="py-2 text-[var(--color-chumbo-prix)]/90">
              {Array.isArray(valor) ? valor.join(", ") : String(valor ?? "—")}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
