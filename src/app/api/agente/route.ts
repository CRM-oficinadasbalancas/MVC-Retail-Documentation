import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SYSTEM_PROMPT } from "@/lib/agente/system-prompt";
import { BUSCAR_EQUIPAMENTOS_TOOL, buscarEquipamentos } from "@/lib/agente/tool";

const MODELO_CLAUDE = "claude-sonnet-5";
const MAX_TURNOS_FERRAMENTA = 4;

export async function POST(request: Request) {
  // exige sessão de vendedor autenticado — mesma verificação que protege as
  // páginas via middleware, repetida aqui porque Route Handlers de API não
  // passam pelo layout do grupo (app)
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const { pergunta } = await request.json();
  if (typeof pergunta !== "string" || pergunta.trim().length === 0) {
    return NextResponse.json({ erro: "Pergunta vazia." }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const messages: MessageParam[] = [{ role: "user", content: pergunta }];

  for (let turno = 0; turno < MAX_TURNOS_FERRAMENTA; turno++) {
    const resposta = await anthropic.messages.create({
      model: MODELO_CLAUDE,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [BUSCAR_EQUIPAMENTOS_TOOL],
      messages,
    });

    const blocosFerramenta = resposta.content.filter(
      (bloco) => bloco.type === "tool_use",
    );

    if (blocosFerramenta.length === 0) {
      const texto = resposta.content
        .filter((bloco) => bloco.type === "text")
        .map((bloco) => bloco.text)
        .join("\n");
      return NextResponse.json({ resposta: texto });
    }

    messages.push({ role: "assistant", content: resposta.content });

    const resultadosFerramenta = await Promise.all(
      blocosFerramenta.map(async (bloco) => {
        const resultado = await buscarEquipamentos(
          bloco.input as { modelo?: string; linha?: string; categoria?: string },
        );
        return {
          type: "tool_result" as const,
          tool_use_id: bloco.id,
          content: JSON.stringify(resultado),
        };
      }),
    );

    messages.push({ role: "user", content: resultadosFerramenta });
  }

  return NextResponse.json(
    { erro: "Não consegui concluir a busca. Tente reformular a pergunta." },
    { status: 500 },
  );
}
