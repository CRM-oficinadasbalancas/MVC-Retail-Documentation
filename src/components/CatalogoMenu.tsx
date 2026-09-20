"use client";

import { useState } from "react";
import { EquipamentoCard } from "@/components/EquipamentoCard";
import { CompartilharBotao } from "@/components/CompartilharBotao";
import type { Equipamento, LinhaNegocio } from "@/types/equipamento";

type EquipamentoLista = Pick<Equipamento, "id" | "modelo" | "linha" | "restricoes_uso">;

export interface VideoItem {
  id: string;
  equipamento_id: string;
  modelo: string;
  linha: string;
  titulo: string | null;
  url: string;
}

export interface FotoEquipamento {
  id: string;
  equipamento_id: string;
  modelo: string;
  linha: string;
  url_webp: string;
  url_jpg_fallback: string;
}

const SECAO_VIDEOS = "VIDEOS";
const SECAO_FOTOS = "FOTOS";

// Menu em lista, ancorado à esquerda — cabeçalhos fixos: uma linha por linha
// de negócio (MVC, MVI, ... lidas de linhas_negocio) mais Vídeos e Fotos.
// Cada cabeçalho é um acordeão: abre e mostra os equipamentos daquela linha
// (ou, em Vídeos/Fotos, um sub-menu por linha e depois por produto).
export function CatalogoMenu({
  linhas,
  equipamentos,
  videos,
  fotos,
}: {
  linhas: LinhaNegocio[];
  equipamentos: EquipamentoLista[];
  videos: VideoItem[];
  fotos: FotoEquipamento[];
}) {
  const [secaoAberta, setSecaoAberta] = useState<string | null>(
    linhas[0]?.codigo ?? null,
  );
  const [linhaVideoAberta, setLinhaVideoAberta] = useState<string | null>(
    null,
  );
  const [linhaFotoAberta, setLinhaFotoAberta] = useState<string | null>(null);

  function alternar(codigo: string) {
    setSecaoAberta((atual) => (atual === codigo ? null : codigo));
  }

  return (
    <div className="mr-auto flex w-full max-w-sm flex-col gap-2">
      {linhas.map((l) => (
        <Cabecalho
          key={l.codigo}
          titulo={l.codigo}
          subtitulo={l.nome}
          aberto={secaoAberta === l.codigo}
          onToggle={() => alternar(l.codigo)}
        >
          <ListaEquipamentos
            equipamentos={equipamentos.filter((e) => e.linha === l.codigo)}
          />
        </Cabecalho>
      ))}

      <Cabecalho
        titulo="Vídeos"
        aberto={secaoAberta === SECAO_VIDEOS}
        onToggle={() => alternar(SECAO_VIDEOS)}
      >
        <div className="flex flex-col gap-2">
          {linhas.map((l) => (
            <Cabecalho
              key={l.codigo}
              titulo={l.codigo}
              nivel={2}
              aberto={linhaVideoAberta === l.codigo}
              onToggle={() =>
                setLinhaVideoAberta((atual) =>
                  atual === l.codigo ? null : l.codigo,
                )
              }
            >
              <ListaVideosPorProduto
                videos={videos.filter((v) => v.linha === l.codigo)}
              />
            </Cabecalho>
          ))}
        </div>
      </Cabecalho>

      <Cabecalho
        titulo="Fotos"
        aberto={secaoAberta === SECAO_FOTOS}
        onToggle={() => alternar(SECAO_FOTOS)}
      >
        <div className="flex flex-col gap-2">
          {linhas.map((l) => (
            <Cabecalho
              key={l.codigo}
              titulo={l.codigo}
              nivel={2}
              aberto={linhaFotoAberta === l.codigo}
              onToggle={() =>
                setLinhaFotoAberta((atual) =>
                  atual === l.codigo ? null : l.codigo,
                )
              }
            >
              <ListaFotos fotos={fotos.filter((f) => f.linha === l.codigo)} />
            </Cabecalho>
          ))}
        </div>
      </Cabecalho>
    </div>
  );
}

function Cabecalho({
  titulo,
  subtitulo,
  nivel = 1,
  aberto,
  onToggle,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  nivel?: 1 | 2 | 3;
  aberto: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        nivel === 1
          ? "rounded-md border border-gray-200"
          : nivel === 2
            ? "rounded-md border border-gray-100 bg-gray-50"
            : "rounded-md border border-gray-100 bg-white"
      }
    >
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between gap-2 px-4 text-left ${
          nivel === 1 ? "py-3" : "py-2"
        }`}
      >
        <span className="flex flex-col">
          <span
            className={`font-semibold text-[var(--color-chumbo-prix)] ${
              nivel !== 1 ? "text-sm" : ""
            }`}
          >
            {titulo}
          </span>
          {subtitulo && (
            <span className="text-xs text-[var(--color-chumbo-prix)]/60">
              {subtitulo}
            </span>
          )}
        </span>
        <span className="text-[var(--color-azul-prix)]">
          {aberto ? "−" : "+"}
        </span>
      </button>
      {aberto && (
        <div className={nivel === 1 ? "px-3 pb-3" : "px-2 pb-2"}>
          {children}
        </div>
      )}
    </div>
  );
}

function ListaEquipamentos({
  equipamentos,
}: {
  equipamentos: EquipamentoLista[];
}) {
  if (equipamentos.length === 0) {
    return (
      <p className="text-sm text-[var(--color-chumbo-prix)]/70">
        Nenhum equipamento revisado nessa linha ainda.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {equipamentos.map((equipamento) => (
        <EquipamentoCard key={equipamento.id} equipamento={equipamento} />
      ))}
    </ul>
  );
}

// Um produto pode ter vários vídeos reais (ex.: Prix 5 Plus tem 6) — por isso
// o cabeçalho de cada produto já mostra a quantidade, e só ao abrir aparece
// cada vídeo individualmente com o botão de compartilhar.
function ListaVideosPorProduto({ videos }: { videos: VideoItem[] }) {
  const [produtoAberto, setProdutoAberto] = useState<string | null>(null);

  if (videos.length === 0) {
    return (
      <p className="text-sm text-[var(--color-chumbo-prix)]/70">
        Nenhum vídeo cadastrado ainda nessa linha.
      </p>
    );
  }

  const porEquipamento = new Map<string, VideoItem[]>();
  for (const video of videos) {
    const lista = porEquipamento.get(video.equipamento_id) ?? [];
    lista.push(video);
    porEquipamento.set(video.equipamento_id, lista);
  }

  return (
    <div className="flex flex-col gap-2">
      {Array.from(porEquipamento.entries()).map(([equipamentoId, itens]) => (
        <Cabecalho
          key={equipamentoId}
          titulo={`${itens[0].modelo} (${itens.length} ${itens.length === 1 ? "vídeo" : "vídeos"})`}
          nivel={3}
          aberto={produtoAberto === equipamentoId}
          onToggle={() =>
            setProdutoAberto((atual) =>
              atual === equipamentoId ? null : equipamentoId,
            )
          }
        >
          <ul className="flex flex-col gap-2">
            {itens.map((video) => (
              <li
                key={video.id}
                className="flex items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-2"
              >
                <span className="text-sm text-[var(--color-chumbo-prix)]">
                  {video.titulo ?? "Vídeo"}
                </span>
                <CompartilharBotao
                  url={video.url}
                  titulo={`${itens[0].modelo} — ${video.titulo ?? "Vídeo"}`}
                />
              </li>
            ))}
          </ul>
        </Cabecalho>
      ))}
    </div>
  );
}

function ListaFotos({ fotos }: { fotos: FotoEquipamento[] }) {
  if (fotos.length === 0) {
    return (
      <p className="text-sm text-[var(--color-chumbo-prix)]/70">
        Nenhuma foto cadastrada ainda nessa linha.
      </p>
    );
  }

  // Agrupado por equipamento — um modelo pode ter várias fotos.
  const porEquipamento = new Map<string, FotoEquipamento[]>();
  for (const foto of fotos) {
    const lista = porEquipamento.get(foto.equipamento_id) ?? [];
    lista.push(foto);
    porEquipamento.set(foto.equipamento_id, lista);
  }

  return (
    <ul className="flex flex-col gap-3">
      {Array.from(porEquipamento.entries()).map(([equipamentoId, itens]) => (
        <li
          key={equipamentoId}
          className="flex flex-col gap-2 rounded-md border border-gray-200 bg-white p-3"
        >
          <span className="text-sm font-medium text-[var(--color-chumbo-prix)]">
            {itens[0].modelo} ({itens.length})
          </span>
          <div className="flex flex-wrap gap-2">
            {itens.map((foto) => (
              <div key={foto.id} className="flex flex-col items-start gap-1">
                <picture>
                  <source srcSet={foto.url_webp} type="image/webp" />
                  <img
                    src={foto.url_jpg_fallback}
                    alt={itens[0].modelo}
                    className="h-20 w-20 rounded-md object-cover"
                  />
                </picture>
                <CompartilharBotao
                  url={foto.url_jpg_fallback}
                  titulo={`Foto — ${itens[0].modelo}`}
                />
              </div>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
