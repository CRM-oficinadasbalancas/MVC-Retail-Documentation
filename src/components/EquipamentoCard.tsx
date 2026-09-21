import Link from "next/link";
import type { Equipamento } from "@/types/equipamento";

// Na lista, só o modelo — nada de descritivo, nem o aviso de restrição aqui.
// A ficha completa (specs, diferenciais, restrições) só aparece quando abre
// o equipamento — lá o aviso de restricoes_uso continua sempre em destaque
// via RestricoesAlerta.tsx, isso não muda (regra de segurança, CLAUDE.md §
// "REGRA CRÍTICA"); o que sai daqui é só a repetição na lista.
export function EquipamentoCard({
  equipamento,
}: {
  equipamento: Pick<Equipamento, "id" | "modelo">;
}) {
  return (
    <li className="rounded-md border border-gray-200">
      <Link
        href={`/catalogo/${equipamento.id}`}
        className="flex items-center px-4 py-3"
      >
        <span className="font-semibold text-[var(--color-chumbo-prix)]">
          {equipamento.modelo}
        </span>
      </Link>
    </li>
  );
}
