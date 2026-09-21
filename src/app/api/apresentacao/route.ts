import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gerarApresentacaoPdf } from "@/lib/apresentacao/pdf";
import { CAMPOS_PUBLICOS_EQUIPAMENTO } from "@/types/equipamento";
import type { Equipamento } from "@/types/equipamento";

const MAX_EQUIPAMENTOS_POR_APRESENTACAO = 10;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao.user) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const { ids } = await request.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ erro: "Informe ao menos um equipamento." }, { status: 400 });
  }
  if (ids.length > MAX_EQUIPAMENTOS_POR_APRESENTACAO) {
    return NextResponse.json(
      { erro: `Máximo de ${MAX_EQUIPAMENTOS_POR_APRESENTACAO} equipamentos por apresentação.` },
      { status: 400 },
    );
  }

  // client autenticado (não service role) — RLS garante que só equipamentos
  // revisados e ativos entram na apresentação, mesmo que um id de rascunho
  // seja passado no corpo da requisição
  const { data: equipamentos, error } = await supabase
    .from("equipamentos")
    .select(CAMPOS_PUBLICOS_EQUIPAMENTO.join(", "))
    .in("id", ids);

  if (error) {
    return NextResponse.json({ erro: "Falha ao buscar dados dos equipamentos." }, { status: 500 });
  }
  if (!equipamentos || equipamentos.length === 0) {
    return NextResponse.json({ erro: "Nenhum equipamento revisado encontrado para esses ids." }, { status: 404 });
  }

  const equipamentosTipados = equipamentos as unknown as Equipamento[];

  // RLS de imagens_equipamento já garante que só imagens de equipamentos
  // revisados/ativos voltam aqui (mesma policy usada em /catalogo)
  const { data: imagensData } = await supabase
    .from("imagens_equipamento")
    .select("equipamento_id, url_jpg_fallback, tipo, ordem")
    .in("equipamento_id", equipamentosTipados.map((e) => e.id))
    .order("ordem");

  // Prioriza a foto tipo 'produto'; na ausência dela, usa a primeira
  // imagem disponível de qualquer tipo — nunca uma foto de outro modelo.
  const urlsFoto = new Map<string, string>();
  for (const img of imagensData ?? []) {
    if (img.tipo === "produto" && !urlsFoto.has(img.equipamento_id)) {
      urlsFoto.set(img.equipamento_id, img.url_jpg_fallback);
    }
  }
  for (const img of imagensData ?? []) {
    if (!urlsFoto.has(img.equipamento_id)) {
      urlsFoto.set(img.equipamento_id, img.url_jpg_fallback);
    }
  }

  const pdfBytes = await gerarApresentacaoPdf(equipamentosTipados, urlsFoto);

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="apresentacao-toledo.pdf"',
    },
  });
}
