import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { CAMPOS_PUBLICOS_EQUIPAMENTO } from "@/types/equipamento";

/**
 * A ÚNICA ferramenta que o agente de IA pode chamar em produção — ver
 * CLAUDE.md § "REGRA CRÍTICA — zero invenção da IA". Filtros são
 * estruturados (nunca SQL/texto livre) para não abrir espaço pra
 * prompt injection virar uma query arbitrária no banco.
 */
export const BUSCAR_EQUIPAMENTOS_TOOL: Tool = {
  name: "buscar_equipamentos",
  description:
    "Busca equipamentos Toledo revisados e ativos no catálogo oficial. Retorna só o que está cadastrado — nunca invente um resultado que a ferramenta não retornou.",
  input_schema: {
    type: "object",
    properties: {
      modelo: {
        type: "string",
        description: "Busca parcial pelo nome/código do modelo, ex.: \"2098\"",
      },
      linha: {
        type: "string",
        enum: ["MVC", "MVI", "MVV"],
        description: "Filtra pela linha de negócio",
      },
      categoria: {
        type: "string",
        description:
          "Filtra pela categoria exata (ex.: \"Bancada e Pesadoras\")",
      },
    },
  },
};

interface FiltroBusca {
  modelo?: string;
  linha?: string;
  categoria?: string;
}

const LIMITE_RESULTADOS = 20;

export async function buscarEquipamentos(filtro: FiltroBusca) {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from("equipamentos")
    .select(CAMPOS_PUBLICOS_EQUIPAMENTO.join(", "))
    // reforço deliberado dos mesmos filtros do RLS — mesmo usando a service
    // role key (que ignora RLS), a IA nunca deve ver rascunho não revisado
    .eq("status", "ativo")
    .not("revisado_por", "is", null)
    .limit(LIMITE_RESULTADOS);

  if (filtro.modelo) {
    query = query.ilike("modelo", `%${filtro.modelo}%`);
  }
  if (filtro.linha) {
    query = query.eq("linha", filtro.linha);
  }
  if (filtro.categoria) {
    query = query.eq("categoria", filtro.categoria);
  }

  const { data, error } = await query;

  if (error) {
    return { erro: "Falha ao consultar o catálogo. Tente de novo." };
  }

  if (!data || data.length === 0) {
    return { equipamentos: [], aviso: "Nenhum equipamento encontrado para esse filtro." };
  }

  return { equipamentos: data };
}
