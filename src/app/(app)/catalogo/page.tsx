import { createClient } from "@/lib/supabase/server";
import { CatalogoMenu, type FotoEquipamento } from "@/components/CatalogoMenu";

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

  const { data: imagens } = await supabase
    .from("imagens_equipamento")
    .select("id, url_webp, url_jpg_fallback, equipamento_id, equipamentos(modelo, linha)")
    .order("ordem");

  const fotos: FotoEquipamento[] = (imagens ?? []).map((imagem) => {
    const equipamento = Array.isArray(imagem.equipamentos)
      ? imagem.equipamentos[0]
      : imagem.equipamentos;
    return {
      id: imagem.id,
      equipamento_id: imagem.equipamento_id,
      url_webp: imagem.url_webp,
      url_jpg_fallback: imagem.url_jpg_fallback,
      modelo: equipamento?.modelo ?? "",
      linha: equipamento?.linha ?? "",
    };
  });

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
        <CatalogoMenu
          linhas={linhas ?? []}
          equipamentos={equipamentos ?? []}
          fotos={fotos}
        />
      )}
    </div>
  );
}
