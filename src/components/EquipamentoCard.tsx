import Link from "next/link";
import type { Equipamento } from "@/types/equipamento";

export function EquipamentoCard({
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
