"use client";

import { useState } from "react";
import { EquipamentoCard } from "@/components/EquipamentoCard";
import { CompartilharBotao } from "@/components/CompartilharBotao";
import type { Equipamento, LinhaNegocio } from "@/types/equipamento";

type EquipamentoLista = Pick<
  Equipamento,
  | "id"
  | "modelo"
  | "linha"
  | "categoria"
  | "descricao_curta"
  | "restricoes_uso"
  | "url_video"
>;

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

// Menu em lista, ancorado à direita (não abas no topo) — cabeçalhos fixos:
// uma linha por linha de negócio (MVC, MVI, ... lidas de linhas_negocio) mais
// Vídeos e Fotos. Cada cabeçalho é um acordeão: abre e mostra os
// equipamentos daquela linha (ou, em Vídeos/Fotos, um sub-menu por linha).
export function CatalogoMenu({
  linhas,
  equipamentos,
  fotos,
}: {
  linhas: LinhaNegocio[];
  equipamentos: EquipamentoLista[];
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
    <div className="ml-auto flex w-full max-w-sm flex-col gap-2">
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
              <ListaVideos
                equipamentos={equipamentos.filter(
                  (e) => e.linha === l.codigo && e.url_video,
                )}
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
  nivel?: 1 | 2;
  aberto: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        nivel === 1
          ? "rounded-md border border-gray-200"
          : "rounded-md border border-gray-100 bg-gray-50"
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
              nivel === 2 ? "text-sm" : ""
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

function ListaVideos({ equipamentos }: { equipamentos: EquipamentoLista[] }) {
  if (equipamentos.length === 0) {
    return (
      <p className="text-sm text-[var(--color-chumbo-prix)]/70">
        Nenhum vídeo cadastrado ainda nessa linha.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {equipamentos.map((equipamento) => (
        <li
          key={equipamento.id}
          className="flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-3 py-2"
        >
          <span className="text-sm font-medium text-[var(--color-chumbo-prix)]">
            {equipamento.modelo}
          </span>
          <CompartilharBotao
            url={equipamento.url_video!}
            titulo={`Vídeo — ${equipamento.modelo}`}
          />
        </li>
      ))}
    </ul>
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
            {itens[0].modelo}
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
