export type LinhaCodigo = "MVC" | "MVI" | "MVV";

export interface LinhaNegocio {
  codigo: LinhaCodigo;
  nome: string;
}

/**
 * specs_tecnicas é jsonb livre — o schema varia por categoria (ver exemplos
 * comentados em schema.sql para MVC/MVI). Guardamos como registro de chaves
 * conhecidas mas abertas, nunca inventamos um formato fixo que não existe na
 * ficha técnica de origem.
 */
export type SpecsTecnicas = Record<string, string | number | string[] | null>;

export interface Equipamento {
  id: string;
  modelo: string;
  linha: LinhaCodigo;
  categoria: string | null;
  descricao_curta: string | null;
  specs_tecnicas: SpecsTecnicas;
  restricoes_uso: string | null;
  url_ficha_tecnica: string | null;
  status: "ativo" | "descontinuado";
  fonte: string;
  revisado_por: string | null;
  revisado_em: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface ImagemEquipamento {
  id: string;
  equipamento_id: string;
  url_webp: string;
  url_jpg_fallback: string;
  tipo: "produto" | "detalhe" | "aplicacao";
  ordem: number;
}

/**
 * Campos de equipamentos seguros para expor ao vendedor e à ferramenta de IA.
 * preco_faixa fica de fora deliberadamente — ver CLAUDE.md § "Preço — fora de escopo".
 */
export const CAMPOS_PUBLICOS_EQUIPAMENTO = [
  "id",
  "modelo",
  "linha",
  "categoria",
  "descricao_curta",
  "specs_tecnicas",
  "restricoes_uso",
  "url_ficha_tecnica",
  "status",
  "fonte",
  "revisado_por",
  "revisado_em",
] as const;
