import Link from "next/link";
import type { Equipamento } from "@/types/equipamento";

// Na lista, só o modelo — nada de descritivo aqui. A ficha completa (specs,
// diferenciais, restrições) só aparece quando abre o equipamento.
// Exceção: restricoes_uso nunca fica escondido (ver CLAUDE.md § "zero
// invenção" / regra de segurança), por isso o aviso continua na lista.
export function EquipamentoCard({
  equipamento,
}: {
  equipamento: Pick<Equipamento, "id" | "modelo" | "restricoes_uso">;
}) {
  return (
    <li className="rounded-md border border-gray-200">
      <Link
        href={`/catalogo/${equipamento.id}`}
        className="flex items-center justify-between gap-2 px-4 py-3"
      >
        <span className="font-semibold text-[var(--color-chumbo-prix)]">
          {equipamento.modelo}
        </span>
        {equipamento.restricoes_uso && (
          <span className="text-xs font-medium text-amber-700">
            ⚠ Restrição
          </span>
        )}
      </Link>
    </li>
  );
}
