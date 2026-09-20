import { createClient } from "@/lib/supabase/server";
import {
  CatalogoMenu,
  type FotoEquipamento,
  type VideoItem,
} from "@/components/CatalogoMenu";

export default async function CatalogoPage() {
  const supabase = await createClient();

  const { data: linhas } = await supabase
    .from("linhas_negocio")
    .select("codigo, nome")
    .order("codigo");

  const { data: equipamentos, error } = await supabase
    .from("equipamentos")
    .select("id, modelo, linha, restricoes_uso, status")
    .order("modelo");

  const { data: imagensData } = await supabase
    .from("imagens_equipamento")
    .select(
      "id, url_webp, url_jpg_fallback, equipamento_id, equipamentos(modelo, linha)",
    )
    .order("ordem");

  const { data: videosData } = await supabase
    .from("videos_equipamento")
    .select("id, titulo, url, equipamento_id, equipamentos(modelo, linha)")
    .order("ordem");

  function equipamentoDoJoin(valor: unknown) {
    const equipamento = Array.isArray(valor) ? valor[0] : valor;
    return equipamento as { modelo?: string; linha?: string } | null;
  }

  const fotos: FotoEquipamento[] = (imagensData ?? []).map((imagem) => {
    const equipamento = equipamentoDoJoin(imagem.equipamentos);
    return {
      id: imagem.id,
      equipamento_id: imagem.equipamento_id,
      url_webp: imagem.url_webp,
      url_jpg_fallback: imagem.url_jpg_fallback,
      modelo: equipamento?.modelo ?? "",
      linha: equipamento?.linha ?? "",
    };
  });

  const videos: VideoItem[] = (videosData ?? []).map((video) => {
    const equipamento = equipamentoDoJoin(video.equipamentos);
    return {
      id: video.id,
      equipamento_id: video.equipamento_id,
      titulo: video.titulo,
      url: video.url,
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
          videos={videos}
          fotos={fotos}
        />
      )}
    </div>
  );
}
