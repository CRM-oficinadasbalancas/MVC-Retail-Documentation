import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Equipamento } from "@/types/equipamento";

// Identidade visual Toledo — mesmos tokens de src/app/globals.css
const AZUL_PRIX = rgb(0x0b / 255, 0x66 / 255, 0xb2 / 255);
const CHUMBO_PRIX = rgb(0x2c / 255, 0x2c / 255, 0x39 / 255);
const BRANCO = rgb(1, 1, 1);
const AMBAR = rgb(0.7, 0.35, 0);

const LARGURA = 595.28; // A4 pt
const ALTURA = 841.89;
const MARGEM = 48;
const ALTURA_HEADER = 56;
const ALTURA_FOOTER = 36;

/**
 * Gera o PDF da apresentação. Todos os números e specs vêm direto de
 * `equipamentos` (lido pelo código, não pela IA) — ver CLAUDE.md § "REGRA
 * CRÍTICA". Logo é placeholder (texto "Toledo") até recebermos o arquivo
 * oficial — mesmo texto usado em src/components/Header.tsx.
 */
export async function gerarApresentacaoPdf(
  equipamentos: Equipamento[],
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const fonteRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fonteBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  for (const equipamento of equipamentos) {
    desenharPaginaEquipamento(pdf, fonteRegular, fonteBold, equipamento);
  }

  return pdf.save();
}

function novaPagina(pdf: PDFDocument, fonteBold: PDFFont) {
  const page = pdf.addPage([LARGURA, ALTURA]);

  page.drawRectangle({
    x: 0,
    y: ALTURA - ALTURA_HEADER,
    width: LARGURA,
    height: ALTURA_HEADER,
    color: AZUL_PRIX,
  });
  page.drawText("Toledo", {
    x: MARGEM,
    y: ALTURA - ALTURA_HEADER / 2 - 7,
    size: 18,
    font: fonteBold,
    color: BRANCO,
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
  equipamento: Equipamento,
) {
  const page = novaPagina(pdf, fonteBold);
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

  const especificacoes = Object.entries(equipamento.specs_tecnicas ?? {});
  if (especificacoes.length > 0) {
    page.drawText("Especificações técnicas", {
      x: MARGEM,
      y,
      size: 13,
      font: fonteBold,
      color: CHUMBO_PRIX,
    });
    y -= 20;

    for (const [chave, valor] of especificacoes) {
      const texto = `${formatarChave(chave)}: ${formatarValor(valor)}`;
      y = desenharTextoComQuebra(page, texto, {
        x: MARGEM,
        y,
        largura: larguraUtil,
        fonte: fonteRegular,
        tamanho: 10.5,
        cor: CHUMBO_PRIX,
      });
      y -= 6;
    }
  } else {
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
