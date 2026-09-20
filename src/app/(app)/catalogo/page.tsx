import { createClient } from "@/lib/supabase/server";
import { CatalogoTabs } from "@/components/CatalogoTabs";

export default async function CatalogoPage() {
  const supabase = await createClient();

  const { data: linhas } = await supabase
    .from("linhas_negocio")
    .select("codigo, nome")
    .order("codigo");

  const { data: equipamentos, error } = await supabase
    .from("equipamentos")
    .select(
      "id, modelo, linha, categoria, descricao_curta, restricoes_uso, url_video, status",
    )
    .order("modelo");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-[var(--color-chumbo-prix)]">
        Catálogo
      </h1>

      {error && (
        <p className="text-sm text-red-600">
          Não foi possível carregar o catálogo agora. Tente novamente.
        </p>
      )}

      {!error && (
        <CatalogoTabs linhas={linhas ?? []} equipamentos={equipamentos ?? []} />
      )}
    </div>
  );
}
