import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BotaoVoltar } from "@/components/BotaoVoltar";
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
      <BotaoVoltar fallbackHref="/catalogo" />

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

      <CapacidadeDestaque specs={equipamento.specs_tecnicas as SpecsTecnicas} />
      <DiferenciaisDestaque specs={equipamento.specs_tecnicas as SpecsTecnicas} />
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

// Chaves mostradas em destaque separado (capacidade e diferenciais), não repetidas
// na tabela de detalhes técnicos abaixo.
const CHAVES_CAPACIDADE = ["capacidade_min_kg", "capacidade_max_kg"];
const CHAVE_DIFERENCIAIS = "diferenciais";

function CapacidadeDestaque({ specs }: { specs: SpecsTecnicas }) {
  const min = specs?.capacidade_min_kg;
  const max = specs?.capacidade_max_kg;
  if (min == null && max == null) return null;

  return (
    <p className="text-lg font-semibold text-[var(--color-chumbo-prix)]">
      Capacidade: {min ?? "—"} a {max ?? "—"} kg
    </p>
  );
}

// "diferenciais" é o argumento de venda — o que ajuda o vendedor a convencer o
// cliente na rua. Sempre em destaque, nunca misturado na tabela técnica.
function DiferenciaisDestaque({ specs }: { specs: SpecsTecnicas }) {
  const diferenciais = specs?.[CHAVE_DIFERENCIAIS];
  if (!Array.isArray(diferenciais) || diferenciais.length === 0) return null;

  return (
    <div className="rounded-md border border-[var(--color-azul-prix)]/30 bg-[var(--color-azul-prix)]/5 p-4">
      <p className="mb-2 font-semibold text-[var(--color-azul-prix)]">
        Por que vender este modelo
      </p>
      <ul className="flex flex-col gap-1.5 text-sm text-[var(--color-chumbo-prix)]">
        {diferenciais.map((item) => (
          <li key={String(item)} className="flex gap-2">
            <span className="text-[var(--color-azul-prix)]">•</span>
            <span>{String(item)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SpecsTable({ specs }: { specs: SpecsTecnicas }) {
  const entradas = Object.entries(specs ?? {}).filter(
    ([chave]) => chave !== CHAVE_DIFERENCIAIS && !CHAVES_CAPACIDADE.includes(chave),
  );
  if (entradas.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-[var(--color-chumbo-prix)]/70">
        Detalhes técnicos
      </p>
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
    </div>
  );
}
