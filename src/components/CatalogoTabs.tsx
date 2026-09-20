"use client";

import { useMemo, useState } from "react";
import { EquipamentoCard } from "@/components/EquipamentoCard";
import type { Equipamento, LinhaNegocio } from "@/types/equipamento";

type EquipamentoCatalogo = Pick<
  Equipamento,
  | "id"
  | "modelo"
  | "linha"
  | "categoria"
  | "descricao_curta"
  | "restricoes_uso"
  | "url_video"
>;

const ABA_VIDEOS = "VIDEOS" as const;

// Abas dinâmicas a partir de linhas_negocio (não hardcoded) — quando a MVV for
// lançada, aparece aqui automaticamente sem precisar tocar neste componente.
// Ver CLAUDE.md § "Confirmado: MVC = ... MVI = ...".
export function CatalogoTabs({
  linhas,
  equipamentos,
}: {
  linhas: LinhaNegocio[];
  equipamentos: EquipamentoCatalogo[];
}) {
  const [abaAtiva, setAbaAtiva] = useState<string>(
    linhas[0]?.codigo ?? ABA_VIDEOS,
  );

  const equipamentosComVideo = useMemo(
    () => equipamentos.filter((e) => e.url_video),
    [equipamentos],
  );

  const equipamentosDaAba = useMemo(
    () => equipamentos.filter((e) => e.linha === abaAtiva),
    [equipamentos, abaAtiva],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        {linhas.map((l) => (
          <AbaBotao
            key={l.codigo}
            ativa={abaAtiva === l.codigo}
            onClick={() => setAbaAtiva(l.codigo)}
          >
            {l.codigo}
          </AbaBotao>
        ))}
        <AbaBotao
          ativa={abaAtiva === ABA_VIDEOS}
          onClick={() => setAbaAtiva(ABA_VIDEOS)}
        >
          Vídeos
        </AbaBotao>
      </div>

      {abaAtiva === ABA_VIDEOS ? (
        <ListaVideos equipamentos={equipamentosComVideo} />
      ) : (
        <>
          {equipamentosDaAba.length === 0 && (
            <p className="text-sm text-[var(--color-chumbo-prix)]/70">
              Nenhum equipamento revisado nessa linha ainda.
            </p>
          )}
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {equipamentosDaAba.map((equipamento) => (
              <EquipamentoCard key={equipamento.id} equipamento={equipamento} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function AbaBotao({
  ativa,
  onClick,
  children,
}: {
  ativa: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
        ativa
          ? "border-[var(--color-azul-prix)] text-[var(--color-azul-prix)]"
          : "border-transparent text-[var(--color-chumbo-prix)]/60 hover:text-[var(--color-chumbo-prix)]"
      }`}
    >
      {children}
    </button>
  );
}

// Preview embutido do próprio Drive — sem baixar/re-hospedar o vídeo, o link é
// sempre o mesmo arquivo real encontrado na pasta oficial "5 - Vídeos".
function urlPreview(urlVideo: string) {
  return urlVideo.replace("/view", "/preview");
}

function ListaVideos({
  equipamentos,
}: {
  equipamentos: EquipamentoCatalogo[];
}) {
  if (equipamentos.length === 0) {
    return (
      <p className="text-sm text-[var(--color-chumbo-prix)]/70">
        Nenhum vídeo cadastrado ainda para os modelos revisados.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {equipamentos.map((equipamento) => (
        <li key={equipamento.id} className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-[var(--color-chumbo-prix)]">
            {equipamento.linha} · {equipamento.modelo}
          </span>
          <div className="aspect-video w-full overflow-hidden rounded-md border border-gray-200">
            <iframe
              src={urlPreview(equipamento.url_video!)}
              className="h-full w-full"
              allow="autoplay"
              title={`Vídeo — ${equipamento.modelo}`}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
