import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import type { Equipamento } from "@/types/equipamento";

// Identidade visual Toledo — mesmos tokens de src/app/globals.css
const AZUL_PRIX = rgb(0x0b / 255, 0x66 / 255, 0xb2 / 255);
const CHUMBO_PRIX = rgb(0x2c / 255, 0x2c / 255, 0x39 / 255);
const BRANCO = rgb(1, 1, 1);
const AMBAR = rgb(0.7, 0.35, 0);
const AMBAR_FUNDO = rgb(1, 0.97, 0.9);
const CINZA_FAIXA = rgb(0.95, 0.96, 0.97);
const CINZA_BORDA = rgb(0.85, 0.85, 0.87);

// A4 paisagem — uma grade comparativa cabe muito melhor deitada do que uma
// página por modelo em pé (formato anterior). Ver exemplo de referência que
// o usuário compartilhou: cabeçalho com logo, tabela com um modelo por
// coluna, rodapé com a fonte.
const LARGURA = 841.89;
const ALTURA = 595.28;
const MARGEM = 36;
const ALTURA_TOPO = 74;
const ALTURA_FOOTER = 26;
const LARGURA_LABEL = 130;
const TAMANHO_FONTE_GRADE = 8.5;
const ALTURA_LINHA_TEXTO = TAMANHO_FONTE_GRADE + 3.5;
const PADDING_CELULA = 6;

// Rótulos legíveis para o cliente final — as chaves em snake_case do banco
// não vão bonitas num PDF que o vendedor compartilha. Chave sem entrada aqui
// cai no fallback (troca "_" por espaço).
const ROTULOS: Record<string, string> = {
  display: "Display",
  classe_exatidao: "Classe de exatidão",
  opcoes_comunicacao: "Comunicação",
  montagens_disponiveis: "Versões/montagens disponíveis",
  terminais_compativeis: "Terminais compatíveis",
  acessorios_opcionais: "Acessórios opcionais",
  material_prato: "Prato de pesagem",
  material_plataforma: "Plataforma",
  material_base: "Base",
  material_indicador: "Indicador",
  gabinete: "Gabinete",
  temperatura_operacao: "Temperatura de operação",
  sistema_oscilacao: "Sistema de oscilação",
  bateria_interna_opcional: "Bateria interna",
  grau_protecao: "Grau de proteção",
  grau_protecao_celula_carga: "Grau de proteção (célula de carga)",
  grau_protecao_indicador: "Grau de proteção (indicador)",
  plataformas_disponiveis: "Tamanhos de plataforma",
  cabo_celula_carga: "Cabo da célula de carga",
  indicador: "Indicador",
  instalacao: "Instalação",
};

const CHAVES_EXCLUIDAS_DA_GRADE = new Set([
  "diferenciais",
  "capacidade_min_kg",
  "capacidade_max_kg",
]);

/**
 * Gera o PDF comparativo — uma grade com um modelo por coluna, pensada pra
 * ser compartilhada direto com o cliente (referência: comparativo que o
 * usuário trouxe pronto). Todos os números e specs vêm direto de
 * `equipamentos` (lido pelo código, não pela IA) — ver CLAUDE.md § "REGRA
 * CRÍTICA". Logo é a marca oficial Prix (public/logo/prix-logo.png), sempre
 * o mesmo arquivo, nunca escolhido pela IA a cada geração.
 */
export async function gerarApresentacaoPdf(
  equipamentos: Equipamento[],
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const fonteRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fonteBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fonteItalica = await pdf.embedFont(StandardFonts.HelveticaOblique);

  const logoBytes = await readFile(
    path.join(process.cwd(), "public", "logo", "prix-logo.png"),
  );
  const logo = await pdf.embedPng(logoBytes);

  const fontes = { fonteRegular, fonteBold, fonteItalica };
  const larguraColuna = (LARGURA - MARGEM * 2 - LARGURA_LABEL) / equipamentos.length;

  let pagina = novaPaginaGrade(pdf, logo, fontes, equipamentos);
  let y = ALTURA - ALTURA_TOPO - 12;

  y = desenharCabecalhoColunas(pagina, fontes, equipamentos, y, larguraColuna);

  for (const linha of montarLinhasGrade(equipamentos)) {
    const alturaLinha = alturaDaLinha(linha, fontes.fonteRegular, larguraColuna);

    if (y - alturaLinha < ALTURA_FOOTER + 12) {
      pagina = novaPaginaGrade(pdf, logo, fontes, equipamentos);
      y = ALTURA - ALTURA_TOPO - 12;
      y = desenharCabecalhoColunas(pagina, fontes, equipamentos, y, larguraColuna);
    }

    desenharLinhaGrade(pagina, fontes, linha, y, alturaLinha, larguraColuna);
    y -= alturaLinha;
  }

  desenharSecaoDiferenciais(pdf, logo, fontes, equipamentos);

  return pdf.save();
}

interface Fontes {
  fonteRegular: PDFFont;
  fonteBold: PDFFont;
  fonteItalica: PDFFont;
}

function novaPaginaGrade(
  pdf: PDFDocument,
  logo: PDFImage,
  fontes: Fontes,
  equipamentos: Equipamento[],
): PDFPage {
  const page = pdf.addPage([LARGURA, ALTURA]);

  const alturaLogo = 30;
  const larguraLogo = alturaLogo * (logo.width / logo.height);
  page.drawImage(logo, {
    x: MARGEM,
    y: ALTURA - MARGEM - alturaLogo + 6,
    width: larguraLogo,
    height: alturaLogo,
  });

  const xTexto = MARGEM + larguraLogo + 12;
  page.drawText("Toledo do Brasil", {
    x: xTexto,
    y: ALTURA - MARGEM - 4,
    size: 14,
    font: fontes.fonteBold,
    color: AZUL_PRIX,
  });

  const linhas = [...new Set(equipamentos.map((e) => e.linha))].join("/");
  const categorias = [...new Set(equipamentos.map((e) => e.categoria).filter(Boolean))];
  const subtitulo =
    categorias.length === 1
      ? `Comparativo técnico — Linha ${linhas} · ${categorias[0]}`
      : `Comparativo técnico — Linha ${linhas}`;
  page.drawText(subtitulo, {
    x: xTexto,
    y: ALTURA - MARGEM - 20,
    size: 9.5,
    font: fontes.fonteRegular,
    color: CHUMBO_PRIX,
  });

  page.drawLine({
    start: { x: MARGEM, y: ALTURA - ALTURA_TOPO },
    end: { x: LARGURA - MARGEM, y: ALTURA - ALTURA_TOPO },
    thickness: 1,
    color: CINZA_BORDA,
  });

  page.drawRectangle({
    x: 0,
    y: 0,
    width: LARGURA,
    height: ALTURA_FOOTER,
    color: CHUMBO_PRIX,
  });
  page.drawText(
    "Fonte: catálogos comerciais Toledo do Brasil. Especificações sujeitas a alteração sem aviso prévio.",
    {
      x: MARGEM,
      y: ALTURA_FOOTER / 2 - 3,
      size: 7,
      font: fontes.fonteRegular,
      color: BRANCO,
    },
  );

  return page;
}

function desenharCabecalhoColunas(
  page: PDFPage,
  fontes: Fontes,
  equipamentos: Equipamento[],
  yTopo: number,
  larguraColuna: number,
): number {
  const alturaCabecalho = 36;
  const yBase = yTopo - alturaCabecalho;

  page.drawRectangle({
    x: MARGEM,
    y: yBase,
    width: LARGURA - MARGEM * 2,
    height: alturaCabecalho,
    color: AZUL_PRIX,
  });

  equipamentos.forEach((equipamento, indice) => {
    const x = MARGEM + LARGURA_LABEL + indice * larguraColuna;
    page.drawText(equipamento.modelo, {
      x: x + PADDING_CELULA,
      y: yBase + alturaCabecalho - 15,
      size: 10.5,
      font: fontes.fonteBold,
      color: BRANCO,
      maxWidth: larguraColuna - PADDING_CELULA * 2,
    });
    const subtitulo = `${equipamento.linha}${equipamento.categoria ? ` · ${equipamento.categoria}` : ""}`;
    page.drawText(subtitulo, {
      x: x + PADDING_CELULA,
      y: yBase + 8,
      size: 7.5,
      font: fontes.fonteItalica,
      color: rgb(0.85, 0.92, 0.98),
      maxWidth: larguraColuna - PADDING_CELULA * 2,
    });
  });

  return yBase;
}

interface LinhaGrade {
  rotulo: string;
  valores: string[];
  destaqueRestricao?: boolean;
}

function montarLinhasGrade(equipamentos: Equipamento[]): LinhaGrade[] {
  const linhas: LinhaGrade[] = [];

  linhas.push({
    rotulo: "Capacidade de pesagem",
    valores: equipamentos.map((e) => {
      const min = e.specs_tecnicas?.capacidade_min_kg;
      const max = e.specs_tecnicas?.capacidade_max_kg;
      if (min == null && max == null) return "—";
      return `${min ?? "—"} a ${max ?? "—"} kg`;
    }),
  });

  const temRestricao = equipamentos.some((e) => e.restricoes_uso);
  if (temRestricao) {
    linhas.push({
      rotulo: "Restrições de uso",
      valores: equipamentos.map((e) => e.restricoes_uso ?? "Nenhuma"),
      destaqueRestricao: true,
    });
  }

  const chaves: string[] = [];
  for (const e of equipamentos) {
    for (const chave of Object.keys(e.specs_tecnicas ?? {})) {
      if (!CHAVES_EXCLUIDAS_DA_GRADE.has(chave) && !chaves.includes(chave)) {
        chaves.push(chave);
      }
    }
  }

  for (const chave of chaves) {
    linhas.push({
      rotulo: ROTULOS[chave] ?? formatarChave(chave),
      valores: equipamentos.map((e) => formatarValor(e.specs_tecnicas?.[chave])),
    });
  }

  return linhas;
}

function quebrarTexto(
  fonte: PDFFont,
  tamanho: number,
  texto: string,
  larguraMax: number,
): string[] {
  const palavras = texto.split(" ");
  const linhas: string[] = [];
  let linhaAtual = "";

  for (const palavra of palavras) {
    const teste = linhaAtual ? `${linhaAtual} ${palavra}` : palavra;
    if (fonte.widthOfTextAtSize(teste, tamanho) > larguraMax && linhaAtual) {
      linhas.push(linhaAtual);
      linhaAtual = palavra;
    } else {
      linhaAtual = teste;
    }
  }
  if (linhaAtual) linhas.push(linhaAtual);
  return linhas.length > 0 ? linhas : [""];
}

function alturaDaLinha(linha: LinhaGrade, fonteRegular: PDFFont, larguraColuna: number): number {
  const larguraCelulaLabel = LARGURA_LABEL - PADDING_CELULA * 2;
  const larguraCelulaValor = larguraColuna - PADDING_CELULA * 2;

  let maxLinhas = quebrarTexto(fonteRegular, TAMANHO_FONTE_GRADE, linha.rotulo, larguraCelulaLabel).length;
  for (const valor of linha.valores) {
    const n = quebrarTexto(fonteRegular, TAMANHO_FONTE_GRADE, valor, larguraCelulaValor).length;
    if (n > maxLinhas) maxLinhas = n;
  }

  return maxLinhas * ALTURA_LINHA_TEXTO + PADDING_CELULA * 2;
}

function desenharLinhaGrade(
  page: PDFPage,
  fontes: Fontes,
  linha: LinhaGrade,
  yTopo: number,
  alturaLinha: number,
  larguraColuna: number,
) {
  const yBase = yTopo - alturaLinha;

  if (linha.destaqueRestricao) {
    page.drawRectangle({
      x: MARGEM,
      y: yBase,
      width: LARGURA - MARGEM * 2,
      height: alturaLinha,
      color: AMBAR_FUNDO,
    });
  }

  if (!linha.destaqueRestricao) {
    page.drawRectangle({
      x: MARGEM,
      y: yBase,
      width: LARGURA_LABEL,
      height: alturaLinha,
      color: CINZA_FAIXA,
    });
  }

  const rotuloLinhas = quebrarTexto(
    fontes.fonteBold,
    TAMANHO_FONTE_GRADE,
    linha.rotulo,
    LARGURA_LABEL - PADDING_CELULA * 2,
  );
  rotuloLinhas.forEach((texto, i) => {
    page.drawText(texto, {
      x: MARGEM + PADDING_CELULA,
      y: yTopo - PADDING_CELULA - ALTURA_LINHA_TEXTO * (i + 1) + 3,
      size: TAMANHO_FONTE_GRADE,
      font: fontes.fonteBold,
      color: linha.destaqueRestricao ? AMBAR : CHUMBO_PRIX,
    });
  });

  linha.valores.forEach((valor, indice) => {
    const x = MARGEM + LARGURA_LABEL + indice * larguraColuna;
    const valorLinhas = quebrarTexto(
      fontes.fonteRegular,
      TAMANHO_FONTE_GRADE,
      valor,
      larguraColuna - PADDING_CELULA * 2,
    );
    valorLinhas.forEach((texto, i) => {
      page.drawText(texto, {
        x: x + PADDING_CELULA,
        y: yTopo - PADDING_CELULA - ALTURA_LINHA_TEXTO * (i + 1) + 3,
        size: TAMANHO_FONTE_GRADE,
        font: fontes.fonteRegular,
        color: linha.destaqueRestricao ? AMBAR : CHUMBO_PRIX,
      });
    });
  });

  page.drawLine({
    start: { x: MARGEM, y: yBase },
    end: { x: LARGURA - MARGEM, y: yBase },
    thickness: 0.5,
    color: CINZA_BORDA,
  });
}

// Depois da grade comparativa (fatos lado a lado), uma seção com o
// argumento de venda de cada modelo — não cabe bem dentro das células da
// grade, mas é essencial pro vendedor usar na conversa com o cliente.
function desenharSecaoDiferenciais(
  pdf: PDFDocument,
  logo: PDFImage,
  fontes: Fontes,
  equipamentos: Equipamento[],
) {
  const comDiferenciais = equipamentos.filter((e) => {
    const d = e.specs_tecnicas?.diferenciais;
    return Array.isArray(d) && d.length > 0;
  });
  if (comDiferenciais.length === 0) return;

  const larguraUtil = LARGURA - MARGEM * 2;
  let page = pdf.addPage([LARGURA, ALTURA]);
  desenharCabecalhoSimples(page, logo, fontes, "Por que vender cada modelo");
  let y = ALTURA - ALTURA_TOPO - 20;

  for (const equipamento of comDiferenciais) {
    const diferenciais = equipamento.specs_tecnicas.diferenciais as string[];
    const alturaBloco =
      22 + diferenciais.reduce((soma, item) => {
        const linhas = quebrarTexto(fontes.fonteRegular, 10, `•  ${item}`, larguraUtil);
        return soma + linhas.length * 13;
      }, 0) + 14;

    if (y - alturaBloco < ALTURA_FOOTER + 12) {
      page = pdf.addPage([LARGURA, ALTURA]);
      desenharCabecalhoSimples(page, logo, fontes, "Por que vender cada modelo (continuação)");
      y = ALTURA - ALTURA_TOPO - 20;
    }

    page.drawText(equipamento.modelo, {
      x: MARGEM,
      y,
      size: 13,
      font: fontes.fonteBold,
      color: AZUL_PRIX,
    });
    y -= 18;

    for (const item of diferenciais) {
      const linhasTexto = quebrarTexto(fontes.fonteRegular, 10, `•  ${item}`, larguraUtil);
      for (const texto of linhasTexto) {
        page.drawText(texto, {
          x: MARGEM,
          y,
          size: 10,
          font: fontes.fonteRegular,
          color: CHUMBO_PRIX,
        });
        y -= 13;
      }
    }
    y -= 14;
  }
}

function desenharCabecalhoSimples(page: PDFPage, logo: PDFImage, fontes: Fontes, titulo: string) {
  const alturaLogo = 30;
  const larguraLogo = alturaLogo * (logo.width / logo.height);
  page.drawImage(logo, {
    x: MARGEM,
    y: ALTURA - MARGEM - alturaLogo + 6,
    width: larguraLogo,
    height: alturaLogo,
  });
  page.drawText(titulo, {
    x: MARGEM + larguraLogo + 12,
    y: ALTURA - MARGEM - 12,
    size: 13,
    font: fontes.fonteBold,
    color: AZUL_PRIX,
  });
  page.drawLine({
    start: { x: MARGEM, y: ALTURA - ALTURA_TOPO },
    end: { x: LARGURA - MARGEM, y: ALTURA - ALTURA_TOPO },
    thickness: 1,
    color: CINZA_BORDA,
  });
  page.drawRectangle({
    x: 0,
    y: 0,
    width: LARGURA,
    height: ALTURA_FOOTER,
    color: CHUMBO_PRIX,
  });
  page.drawText(
    "Fonte: catálogos comerciais Toledo do Brasil. Especificações sujeitas a alteração sem aviso prévio.",
    {
      x: MARGEM,
      y: ALTURA_FOOTER / 2 - 3,
      size: 7,
      font: fontes.fonteRegular,
      color: BRANCO,
    },
  );
}

function formatarChave(chave: string): string {
  return chave.replaceAll("_", " ");
}

function formatarValor(valor: unknown): string {
  if (Array.isArray(valor)) return valor.join(", ");
  if (valor == null) return "—";
  return String(valor);
}
