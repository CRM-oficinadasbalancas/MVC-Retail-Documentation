import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import type { Equipamento, SpecsTecnicas } from "@/types/equipamento";

// Identidade visual Toledo — mesmos tokens de src/app/globals.css
const AZUL_PRIX = rgb(0x0b / 255, 0x66 / 255, 0xb2 / 255);
const CHUMBO_PRIX = rgb(0x2c / 255, 0x2c / 255, 0x39 / 255);
const BRANCO = rgb(1, 1, 1);
const AMBAR = rgb(0.7, 0.35, 0);

// A4 retrato — uma página por modelo. Voltou desse formato depois que a
// grade comparativa em paisagem (usada por um tempo) se mostrou ruim de ler
// no celular, que é o dispositivo principal do vendedor em campo.
const LARGURA = 595.28;
const ALTURA = 841.89;
const MARGEM = 48;
const ALTURA_HEADER = 56;
const ALTURA_FOOTER = 36;
const ALTURA_FOTO = 150;

/**
 * Gera o PDF da apresentação — uma página por modelo, pensada pra ser lida
 * no celular. Todos os números e specs vêm direto de `equipamentos` (lido
 * pelo código, não pela IA) — ver CLAUDE.md § "REGRA CRÍTICA". Logo é a
 * marca oficial Prix (public/logo/prix-logo.png), sempre o mesmo arquivo,
 * nunca escolhido pela IA a cada geração.
 */
export async function gerarApresentacaoPdf(
  equipamentos: Equipamento[],
  urlsFoto: Map<string, string> = new Map(),
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const fonteRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fonteBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const logoBytes = await readFile(
    path.join(process.cwd(), "public", "logo", "prix-logo.png"),
  );
  const logo = await pdf.embedPng(logoBytes);
  const fotos = await embedFotos(pdf, equipamentos, urlsFoto);

  for (const equipamento of equipamentos) {
    desenharPaginaEquipamento(
      pdf,
      fonteRegular,
      fonteBold,
      logo,
      equipamento,
      fotos.get(equipamento.id),
    );
  }

  return pdf.save();
}

// Busca a foto de capa de cada equipamento em imagens_equipamento (tipo
// 'produto' tem prioridade; na falta dele, cai pra primeira imagem
// disponível de qualquer tipo). Equipamento sem nenhuma imagem cadastrada
// fica de fora do mapa — a página segue sem foto, nunca uma imagem
// inventada ou de outro modelo.
async function embedFotos(
  pdf: PDFDocument,
  equipamentos: Equipamento[],
  urlsFoto: Map<string, string>,
): Promise<Map<string, PDFImage>> {
  const resultado = new Map<string, PDFImage>();

  await Promise.all(
    equipamentos.map(async (equipamento) => {
      const url = urlsFoto.get(equipamento.id);
      if (!url) return;

      try {
        const resposta = await fetch(url);
        if (!resposta.ok) return;
        const bytes = new Uint8Array(await resposta.arrayBuffer());

        try {
          resultado.set(equipamento.id, await pdf.embedJpg(bytes));
        } catch {
          resultado.set(equipamento.id, await pdf.embedPng(bytes));
        }
      } catch {
        // imagem indisponível no momento da geração — página segue sem foto
      }
    }),
  );

  return resultado;
}

function novaPagina(pdf: PDFDocument, logo: PDFImage) {
  const page = pdf.addPage([LARGURA, ALTURA]);

  page.drawRectangle({
    x: 0,
    y: ALTURA - ALTURA_HEADER,
    width: LARGURA,
    height: ALTURA_HEADER,
    color: AZUL_PRIX,
  });

  const alturaLogo = ALTURA_HEADER - 16;
  const larguraLogo = alturaLogo * (logo.width / logo.height);
  page.drawImage(logo, {
    x: MARGEM,
    y: ALTURA - ALTURA_HEADER / 2 - alturaLogo / 2,
    width: larguraLogo,
    height: alturaLogo,
  });

  page.drawRectangle({
    x: 0,
    y: 0,
    width: LARGURA,
    height: ALTURA_FOOTER,
    color: CHUMBO_PRIX,
  });

  return page;
}

function desenharPaginaEquipamento(
  pdf: PDFDocument,
  fonteRegular: PDFFont,
  fonteBold: PDFFont,
  logo: PDFImage,
  equipamento: Equipamento,
  foto: PDFImage | undefined,
) {
  const page = novaPagina(pdf, logo);
  let y = ALTURA - ALTURA_HEADER - 40;
  const larguraUtil = LARGURA - MARGEM * 2;

  page.drawText(`${equipamento.linha}${equipamento.categoria ? ` · ${equipamento.categoria}` : ""}`, {
    x: MARGEM,
    y,
    size: 10,
    font: fonteRegular,
    color: AZUL_PRIX,
  });
  y -= 22;

  page.drawText(equipamento.modelo, {
    x: MARGEM,
    y,
    size: 22,
    font: fonteBold,
    color: CHUMBO_PRIX,
  });
  y -= 30;

  if (foto) {
    const escala = Math.min(larguraUtil / foto.width, ALTURA_FOTO / foto.height, 1);
    const w = foto.width * escala;
    const h = foto.height * escala;
    page.drawImage(foto, { x: MARGEM, y: y - h, width: w, height: h });
    y -= h + 16;
  }

  if (equipamento.descricao_curta) {
    y = desenharTextoComQuebra(page, equipamento.descricao_curta, {
      x: MARGEM,
      y,
      largura: larguraUtil,
      fonte: fonteRegular,
      tamanho: 11,
      cor: CHUMBO_PRIX,
    });
    y -= 16;
  }

  if (equipamento.restricoes_uso) {
    const alturaCaixa = 40;
    page.drawRectangle({
      x: MARGEM,
      y: y - alturaCaixa,
      width: larguraUtil,
      height: alturaCaixa,
      borderColor: AMBAR,
      borderWidth: 1.5,
      color: rgb(1, 0.97, 0.9),
    });
    page.drawText("Restrições de uso", {
      x: MARGEM + 8,
      y: y - 14,
      size: 10,
      font: fonteBold,
      color: AMBAR,
    });
    desenharTextoComQuebra(page, equipamento.restricoes_uso, {
      x: MARGEM + 8,
      y: y - 28,
      largura: larguraUtil - 16,
      fonte: fonteRegular,
      tamanho: 10,
      cor: CHUMBO_PRIX,
    });
    y -= alturaCaixa + 20;
  }

  const specs = equipamento.specs_tecnicas ?? {};
  const { capacidade_min_kg, capacidade_max_kg, diferenciais, ...detalhesTecnicos } =
    specs as SpecsTecnicas & { diferenciais?: string[] };

  if (capacidade_min_kg != null || capacidade_max_kg != null) {
    page.drawText(`Capacidade: ${capacidade_min_kg ?? "—"} a ${capacidade_max_kg ?? "—"} kg`, {
      x: MARGEM,
      y,
      size: 13,
      font: fonteBold,
      color: CHUMBO_PRIX,
    });
    y -= 24;
  }

  // "diferenciais" é o argumento de venda (do catálogo comercial) — sempre em
  // destaque antes dos dados técnicos de engenharia, que interessam menos ao
  // vendedor em campo. Ver CLAUDE.md § "Origem dos dados".
  if (Array.isArray(diferenciais) && diferenciais.length > 0) {
    page.drawText("Por que vender este modelo", {
      x: MARGEM,
      y,
      size: 13,
      font: fonteBold,
      color: AZUL_PRIX,
    });
    y -= 18;

    for (const item of diferenciais) {
      y = desenharTextoComQuebra(page, `•  ${String(item)}`, {
        x: MARGEM,
        y,
        largura: larguraUtil,
        fonte: fonteRegular,
        tamanho: 10.5,
        cor: CHUMBO_PRIX,
      });
      y -= 4;
    }
    y -= 14;
  }

  const especificacoes = Object.entries(detalhesTecnicos);
  if (especificacoes.length > 0) {
    page.drawText("Detalhes técnicos", {
      x: MARGEM,
      y,
      size: 11,
      font: fonteBold,
      color: CHUMBO_PRIX,
    });
    y -= 18;

    for (const [chave, valor] of especificacoes) {
      const texto = `${formatarChave(chave)}: ${formatarValor(valor)}`;
      y = desenharTextoComQuebra(page, texto, {
        x: MARGEM,
        y,
        largura: larguraUtil,
        fonte: fonteRegular,
        tamanho: 9.5,
        cor: CHUMBO_PRIX,
      });
      y -= 4;
    }
  } else if (!diferenciais) {
    page.drawText("Nenhuma especificação técnica cadastrada para este modelo.", {
      x: MARGEM,
      y,
      size: 10.5,
      font: fonteRegular,
      color: CHUMBO_PRIX,
    });
    y -= 16;
  }

  const rodape = `Fonte: ${equipamento.fonte}${
    equipamento.revisado_por ? ` · Revisado por ${equipamento.revisado_por}` : ""
  }`;
  page.drawText(rodape, {
    x: MARGEM,
    y: ALTURA_FOOTER / 2 - 4,
    size: 8,
    font: fonteRegular,
    color: BRANCO,
  });
}

function formatarChave(chave: string): string {
  return chave.replaceAll("_", " ");
}

function formatarValor(valor: unknown): string {
  if (Array.isArray(valor)) return valor.join(", ");
  if (valor == null) return "—";
  return String(valor);
}

function desenharTextoComQuebra(
  page: PDFPage,
  texto: string,
  opcoes: {
    x: number;
    y: number;
    largura: number;
    fonte: PDFFont;
    tamanho: number;
    cor: ReturnType<typeof rgb>;
  },
): number {
  const { x, largura, fonte, tamanho, cor } = opcoes;
  let y = opcoes.y;
  const palavras = texto.split(" ");
  let linhaAtual = "";

  for (const palavra of palavras) {
    const linhaTeste = linhaAtual ? `${linhaAtual} ${palavra}` : palavra;
    if (fonte.widthOfTextAtSize(linhaTeste, tamanho) > largura && linhaAtual) {
      page.drawText(linhaAtual, { x, y, size: tamanho, font: fonte, color: cor });
      y -= tamanho + 4;
      linhaAtual = palavra;
    } else {
      linhaAtual = linhaTeste;
    }
  }

  if (linhaAtual) {
    page.drawText(linhaAtual, { x, y, size: tamanho, font: fonte, color: cor });
    y -= tamanho + 4;
  }

  return y;
}
