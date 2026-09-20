@AGENTS.md

# CLAUDE.md — Agente Comercial Toledo

## O que é este projeto

App de apoio comercial para vendedores das linhas **comercial e industrial** da Toledo.
Objetivo: centralizar catálogo de equipamentos, imagens de produto e permitir comparação
entre modelos Toledo (não concorrentes) e geração de apresentação para envio ao cliente.

PWA mobile (Android + iOS) — uma única aplicação web instalável, sem apps nativos
separados, porque o parque de aparelhos dos vendedores é misto.

## Stack

- **Frontend**: Next.js (App Router), como PWA instalável (funciona em Android e iOS pela mesma URL)
- **Backend/dados**: Supabase (Postgres + Storage + Auth)
- **IA**: Claude via API — apenas para busca em linguagem natural, geração de texto
  comparativo e montagem da apresentação. Ver regra crítica abaixo.
- **Deploy**: Vercel

## REGRA CRÍTICA — zero invenção da IA

Este é o requisito mais importante do projeto. A IA **nunca** pode inventar, estimar ou
completar uma especificação técnica.

- Em produção, o agente de IA tem acesso a **uma única ferramenta**: consulta de
  leitura à tabela `equipamentos` no Supabase (`src/lib/agente/tool.ts` —
  `buscarEquipamentos`), com filtros estruturados (`modelo`, `linha`, `categoria`) — nunca
  SQL livre. A busca sempre força `status = 'ativo'` e `revisado_por is not null`, mesmo
  usando a service role key, então a IA nunca vê rascunho não revisado.
- **Sem** ferramenta de busca na web habilitada no agente de produção.
- Se um dado não estiver na tabela, a resposta correta é "não tenho essa informação" —
  nunca uma estimativa. Isso está escrito no system prompt em `src/lib/agente/system-prompt.ts`.
- Na geração de apresentação (PDF), os números que entram no documento são inseridos por
  código lendo direto do banco (`src/app/api/apresentacao/route.ts`) — a IA não participa
  dessa etapa.
- Todo registro em `equipamentos` só entra em produção com `fonte` e `revisado_por`
  preenchidos. Isso não é burocracia — é o mecanismo que impede dado não verificado de
  chegar num orçamento de cliente. Reforçado por RLS (ver `schema.sql`): mesmo a leitura
  autenticada direta do Supabase só vê linhas revisadas e ativas.
- `restricoes_uso` (ex.: restrição Inmetro de uso comercial, ou restrição técnica como
  "não instalar em câmara fria") nunca pode ser omitido quando existir na ficha de
  origem — é informação de segurança/compliance, não opcional. Campo cobre tanto
  restrição legal quanto técnica — visto nas fichas reais de MVC e MVI. Por isso aparece
  sempre em destaque na UI (`src/components/RestricoesAlerta.tsx`), nunca escondido atrás
  de "ver mais".

## Escopo da comparação

Comparação é **entre modelos Toledo entre si** (ajudar o vendedor a escolher/apresentar
o modelo certo do próprio catálogo). Não inclui comparação com concorrentes.

**Nível de detalhe**: catálogo modela no nível de **modelo**, não de cada código de
venda/SKU individual. Um modelo como a 2098 C tem 20+ variantes vendáveis (capacidade ×
comunicação × montagem, cada uma com código próprio) — isso fica só no PDF original,
referenciado por `url_ficha_tecnica`. `specs_tecnicas` guarda um resumo (ex.: faixa de
capacidade, opções de comunicação disponíveis), não cada combinação.

## Preço — fora de escopo deste app

A coluna `preco_faixa` ainda existe fisicamente no schema (era mais simples manter do que
fazer uma migração de remoção agora), mas **está fora de escopo de uso**: nenhuma tela e
nenhuma ferramenta da IA lê ou expõe esse campo. Preço é informação sensível e não deve
estar num app "aberto" para todos os vendedores — será tratado por um trabalho específico
separado, fora deste projeto. Se algo no código passar a ler `preco_faixa`, é regressão.

## Origem dos dados — confirmada com acesso real ao Drive

Pasta "Toledo do Brasil - Vendas" (Drive), estrutura numerada e oficial. Pastas
relevantes para este projeto:

- **7 - (LTP) Lista Técnica de Produtos** → fonte primária de `specs_tecnicas`,
  `restricoes_legais` e `url_ficha_tecnica`. Organizada por categoria (ver abaixo) e
  depois por linha (`LTP - MVC` / `LTP - MVI`).
- **6 - Lista de Preços** → possível fonte de `preco_faixa`.
- **1 - Catálogos - MVC**, **2 - Catálogo - MVI**, **3 - Catálogo Geral** → possível
  fonte de imagens e descrição comercial.
- **11 - Apresentações** → referência de formato para a apresentação gerada pelo app.

**Taxonomia real de categoria** (pastas dentro de LTP - MVC, usar como valores de
`categoria`): Automação Comercial, Bancada e Pesadoras, Balança de Tendal, Checkout,
Coletores de Dados, Computadoras sem Impressor, Estimadoras de Peso, Etiquetas
Eletrônicas, Etiquetas Térmicas, Fatiadores, Impressores, Indicadores, Mídia Interna,
Pesagem de Pessoas, Portáteis, Soluções.

**Confirmado**: MVC = Marketing e Vendas Comercial, MVI = Marketing e Vendas Industrial
— validado até no rodapé das fichas técnicas reais (ex.: "Marketing & Vendas Industrial"
impresso na LTP da 2180 Piso Inox). Uma terceira linha, MVV (Marketing Vendas Varejo),
está a caminho mas ainda não foi lançada oficialmente. Por isso `linha` referencia a
tabela `linhas_negocio` em vez de um `check constraint` fixo — adicionar a MVV quando
lançar é um `insert`, não uma migração de schema.

O padrão de "um modelo tem várias variantes vendáveis com código próprio" (capacidade ×
opção técnica × formato) se repete nas duas linhas — validado na 2098 C (MVC) e na 2180
Piso Inox (MVI). Confirma que a decisão de nível de modelo (não SKU) vale pras duas.

Pipeline Drive → Supabase:
- **Imagens**: sincronização automática, convertidas para WebP (padrão) com JPG como
  fallback. BMP nunca é servido pelo app. **Ainda não implementado** — hoje
  `imagens_equipamento` só é populado manualmente; o job de sync é trabalho futuro.
- **Specs técnicas**: primeira estruturação com revisão humana obrigatória antes de
  publicar (campos `fonte`, `revisado_por`, `revisado_em`).
- Arquivos LTP seguem convenção `ltp-<modelo>_<data>.pdf` — pode haver mais de uma
  revisão do mesmo modelo; sync deve pegar a data mais recente.

## Identidade visual (código de conduta Toledo)

- **Azul Prix** `#0b66b2` (Pantone 307C) — cor de destaque: cabeçalho, botões,
  elementos de ação, tanto no app quanto no documento gerado. Token: `--color-azul-prix`
  em `src/app/globals.css`.
- **Chumbo Prix** `#2c2c39` (Pantone 533C) — neutro escuro: texto, rodapé. Token:
  `--color-chumbo-prix`.
- Logo fixo no cabeçalho e rodapé do app e de todo documento gerado, sempre pelo mesmo
  template — nunca escolhido pela IA a cada geração. Logo real ainda não recebido —
  hoje o header/footer usam só o texto "Toledo" nas cores da marca como placeholder
  (`src/components/Header.tsx`, `src/lib/apresentacao/pdf.ts`); trocar pelo arquivo de
  logo oficial quando disponível.

## Acesso

Login restrito por domínio de e-mail corporativo da Toledo (Google SSO), aplicado em
`src/middleware.ts` contra `ALLOWED_EMAIL_DOMAIN`. **Domínio exato a confirmar** — hoje
`ALLOWED_EMAIL_DOMAIN` está sem valor real no `.env.local.example`; configurar antes de
abrir pro time de vendas, senão qualquer conta Google passa.

## Infraestrutura Supabase — decisão registrada

O projeto Supabase da organização (`CRM-oficinadasbalancas's Org`) já hospedava um app
diferente (CRM de assistência técnica: `clientes`, `equipamentos` do cliente com número
de série, `assistencias_tecnicas`, `estoque_pecas`) com uma tabela `equipamentos` de
estrutura incompatível com a deste projeto. Para não colidir, o Agente Comercial Toledo
usa um **projeto Supabase próprio e separado**: `agente-comercial-toledo`
(ref `xdzkpjqycnjcaohzuprv`, região `sa-east-1`, plano free). Variáveis de ambiente em
`.env.local.example`.

Combinado com o usuário: por ora seguimos nessa interface ("Oficina"); a migração para o
ambiente "Qubo" é um passo futuro explícito, feito depois que o Qubo for limpo — não
implica migrar de volta pro projeto Supabase compartilhado.

## Schema

Ver `schema.sql` na raiz do projeto (inclui as tabelas e as policies de RLS já aplicadas
no projeto Supabase). Tabelas: `linhas_negocio`, `equipamentos` e `imagens_equipamento`.

## Status atual / próximas pendências

1. `specs_tecnicas` já validado com um exemplo real de MVC (2098 C) e um de MVI (2180
   Piso Inox) — ver exemplos comentados no `schema.sql`. Escolher mais 1-2 modelos de
   cada linha antes de popular o catálogo inicial pra garantir que os campos generalizam.
   **A tabela está vazia hoje** — nenhum equipamento real foi inserido ainda.
2. Algumas fichas (ex.: bobina, pá carregadeira, empilhadeira, paleteira na linha MVI)
   exigem preencher um "Datasheet" à parte antes de gerar proposta — ainda não decidido
   se isso vira um campo (`requer_datasheet`) ou fica só como observação manual.
3. Quando a MVV (Varejo) for lançada oficialmente, adicionar em `linhas_negocio` e
   revisar se o app precisa de algum campo específico dela.
4. Scaffold inicial construído nesta sessão: catálogo, comparação, busca com IA
   (ferramenta única) e geração de apresentação em PDF. **Pendente**: sync Drive→Supabase
   de imagens/specs, geração em PPTX (só PDF foi implementado), domínio de e-mail real
   para o login, logo oficial, popular dados reais.
