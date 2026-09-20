// restricoes_uso nunca pode ser omitido quando existir — é informação de
// segurança/compliance (ex.: restrição Inmetro, restrição técnica), não
// opcional. Por isso este componente sempre renderiza em destaque, nunca
// atrás de "ver mais" — ver CLAUDE.md § "REGRA CRÍTICA".
export function RestricoesAlerta({
  restricoes,
}: {
  restricoes: string | null;
}) {
  if (!restricoes) return null;

  return (
    <div className="rounded-md border-2 border-amber-500 bg-amber-50 p-3 text-sm text-amber-900">
      <p className="font-semibold">Restrições de uso</p>
      <p>{restricoes}</p>
    </div>
  );
}
