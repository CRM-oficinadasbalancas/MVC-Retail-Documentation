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

- **1 - Catálogos - MVC** e **2 - Catálogo - MVI** → **fonte primária** de
  `descricao_curta` e `specs_tecnicas`. O foco do app é o vendedor, não o técnico — o
  catálogo já traz a informação no nível de detalhe certo para isso. Organizados por
  nome comercial do produto (ex.: "Prix Splash", "2199"), não pela mesma taxonomia de
  categoria da LTP-MVC — não assumir 1:1 entre nome de pasta e `categoria`.
- **7 - (LTP) Lista Técnica de Produtos** → fonte **complementar**, usada só para
  `restricoes_uso` (quando o catálogo comercial não menciona, o que é comum) e
  `url_ficha_tecnica`. **A LTP pode estar desatualizada em relação ao catálogo** —
  confirmado num caso real (2098 C: catálogo diz capacidade mínima 32 kg, LTP de 2018
  diz 30 kg). Em conflito entre catálogo e LTP, **o catálogo prevalece**, a não ser que
  o revisor humano tenha informação de campo mais precisa (ver nota do 2180 abaixo).
  A LTP-MVC é organizada pela taxonomia de categoria (ver lista abaixo); **a LTP-MVI
  não segue a mesma taxonomia** — é uma mistura de pastas por aplicação
  ("Animais Vivos - Balanças", "Bancada, Piso e Tendal - Terminais") e material de
  referência genérico, não por categoria nem por modelo.
- **Um modelo pode pertencer a mais de uma `linha` com faixas de capacidade
  diferentes** — caso real: "2180 Piso Inox" é vendida tanto na linha comercial
  (capacidade até 3.000 kg) quanto na industrial (até 6.000 kg). Nesse caso o modelo
  entra como **duas linhas em `equipamentos`** (mesmo `modelo`, `linha` diferente,
  `specs_tecnicas.capacidade_max_kg` diferente) — não é duplicidade, é a mesma peça
  vendida sob catalogação diferente por linha. Já um modelo "focado no comércio mas
  também vendido pra indústria" sem faixa de capacidade distinta (caso do 2098 C) não
  precisa dessa duplicação — fica só na linha principal, com nota na `descricao_curta`.
- **6 - Lista de Preços** → possível fonte de `preco_faixa` (fora de escopo, ver acima).
- **3 - Catálogo Geral** → catálogo único (`catalogo_geral_2022_web.pdf`, de 2022 —
  cuidado com desatualização) cobrindo todas as linhas; útil como fallback quando não
  existe catálogo específico do modelo em MVC/MVI.
- **5 - Vídeos** → organizada por nome comercial do produto (mistura com pastas de
  suporte/revenda), não por categoria. Ainda não usada no app.
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
- Logo oficial Prix (`public/logo/prix-logo.png` — selo circular branco com "prix" em
  azul, fundo transparente) fixo no cabeçalho do app e de todo PDF gerado, sempre pelo
  mesmo arquivo — nunca escolhido pela IA a cada geração. Usado em
  `src/components/Header.tsx`, `src/lib/apresentacao/pdf.ts` (embutido via
  `pdf.embedPng`) e `src/app/manifest.ts` (ícone do PWA).

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
no projeto Supabase). Tabelas: `linhas_negocio`, `equipamentos`, `imagens_equipamento` e `videos_equipamento`.

## Status atual / próximas pendências

1. **Catálogo em construção** — 6 registros reais em `equipamentos`, revisados por
   Luiz Gustavo (lgbz1908@gmail.com): 2098 C (MVC), 2095 (MVC), 2180 Piso Inox (MVC,
   até 3.000 kg), 2180 Piso Inox (MVI, até 6.000 kg), 2199 (MVI), Prix 5 Plus (MVC,
   Automação Comercial). Todos com `descricao_curta`/`specs_tecnicas` extraídos do
   catálogo comercial e `restricoes_uso`/`url_ficha_tecnica` complementados pela LTP,
   conforme o processo descrito em "Origem dos dados" acima. Nenhuma imagem cadastrada
   em `imagens_equipamento` ainda.
   - Caso real de fonte antiga vs. atual: no catálogo da Prix 5 Plus, um trecho da
     tabela de especificações técnicas diz "30 kg" enquanto a introdução do mesmo
     catálogo e a LTP dizem "32 kg" (com os 3 códigos de venda reais confirmando
     32 kg). Confirmado por revisão humana: 32 kg é o valor certo, 30 kg é de uma
     versão antiga/descontinuada do equipamento — não necessariamente "a LTP está
     desatualizada", às vezes o próprio catálogo carrega lixo de revisão anterior.
2. Algumas fichas (ex.: bobina, pá carregadeira, empilhadeira, paleteira na linha MVI)
   exigem preencher um "Datasheet" à parte antes de gerar proposta — ainda não decidido
   se isso vira um campo (`requer_datasheet`) ou fica só como observação manual. O
   registro do "2180 Piso Inox" já tem essa observação solta dentro de `restricoes_uso`
   (não é bem uma restrição, é um processo comercial) — revisar quando essa decisão de
   schema for tomada.
3. Quando a MVV (Varejo) for lançada oficialmente, adicionar em `linhas_negocio` e
   revisar se o app precisa de algum campo específico dela.
4. Scaffold inicial construído em sessão anterior: catálogo, comparação, busca com IA
   (ferramenta única) e geração de apresentação em PDF. **Pendente**: sync
   Drive→Supabase de imagens, geração em PPTX (só PDF foi implementado), domínio de
   e-mail real para o login, ampliar o catálogo além dos 5 modelos piloto.
5. Login Google SSO testado de ponta a ponta em produção (`agente-toledo.vercel.app`,
   projeto Vercel `agente-toledo`, sem proteção SSO da própria Vercel — desativada de
   propósito pra não empilhar duas autenticações). Falta só travar
   `ALLOWED_EMAIL_DOMAIN` com o domínio real antes de abrir pro time de vendas.
6. `specs_tecnicas`/`descricao_curta` foram revisados uma segunda vez: a primeira
   extração puxou a seção técnica da LTP (grau de proteção, classe de exatidão etc.),
   que não ajuda o vendedor em campo. Corrigido para priorizar a chave `diferenciais`
   (benefícios/argumentos de venda do catálogo comercial) — ver "Origem dos dados"
   acima. Essa é a estrutura a seguir ao popular novos modelos: sempre extrair
   `diferenciais` do catálogo primeiro, specs de engenharia da LTP só como
   complemento secundário.
7. **PDF gerado em `src/lib/apresentacao/pdf.ts` reformulado** — trocado de "uma
   página por modelo" (retrato) para uma **grade comparativa** em paisagem (um
   modelo por coluna), a pedido do usuário, que trouxe um exemplo pronto como
   referência de formato. Página 1 em diante: grade com todas as chaves de
   `specs_tecnicas` (exceto `diferenciais`) como linhas, capacidade e restrições
   sempre no topo; repagina automaticamente se não couber numa página. Depois da
   grade, uma seção "Por que vender cada modelo" com os `diferenciais` de cada
   equipamento em bullets (não cabem bem dentro das células da grade). Chamada pelo
   botão "Gerar apresentação (PDF)" em `/comparar`, arquivo baixado como
   `comparativo-toledo.pdf`.
8. **Novo layout do `/catalogo`** (`src/components/CatalogoMenu.tsx`) — não é
   abas no topo, é um **menu em lista ancorado à esquerda**, com um cabeçalho
   acordeão por item: `MVC`, `MVI` (dinâmico de `linhas_negocio`, sem
   hardcode), **Vídeos** e **Fotos**. Abrir `MVC`/`MVI` mostra os
   equipamentos daquela linha — na lista, **só o modelo** (sem descritivo;
   `EquipamentoCard` em `src/components/EquipamentoCard.tsx` foi simplificado
   pra isso), a ficha completa (specs, diferenciais, restrições) só aparece
   ao abrir o equipamento. Exceção: o aviso de `restricoes_uso` continua
   visível já na lista — não pode ficar escondido, é regra de segurança (ver
   "REGRA CRÍTICA" acima). Abrir `Vídeos` ou `Fotos` mostra um sub-menu
   aninhado com `MVC`/`MVI` de novo, pra separar o conteúdo por linha antes
   de listar.
   - Vídeos e fotos são pra **compartilhar com o cliente, não assistir/ver
     dentro do app** — por isso cada item tem um botão "Compartilhar"
     (`src/components/CompartilharBotao.tsx`, usa a Web Share API no
     mobile, cai pra copiar o link no desktop), sem player/preview embutido.
   - **Vídeos são 1:N por equipamento** (tabela nova `videos_equipamento`,
     mesmo padrão de `imagens_equipamento` — substituiu a coluna única
     `url_video` que tinha sido criada antes, removida na mesma migration).
     Motivo: um modelo tem vários vídeos reais na pasta "5 - Vídeos" do
     Drive (ex.: Prix 5 Plus tem 6), e o vendedor precisa ver a quantidade
     antes de escolher qual mandar — por isso o cabeçalho de cada produto
     dentro de Vídeos já mostra "Modelo (N vídeos)". Populado até agora:
     Prix 5 Plus (6), Prix 4 Uno (3), Prix 4 Due (1), Prix 4 Trend (1), 2095
     (1) — todos links reais confirmados na pasta do próprio modelo, nunca
     inventados. Vídeos encontrados sob o nome "Prix 6i" (pasta "Prix 6 e 6i
     c/ Etiqueta contínua") **não** foram linkados ao registro "Prix 6" — a
     ficha do "Prix 6" (20.000 itens, TFT 7", leitura 2D) não confirma que
     seja o mesmo produto que os vídeos de "6i" com etiqueta contínua; fica
     sem vídeo até confirmar. Pastas de vídeo do MVI ("Piso", "Bancada" etc.)
     ainda não foram abertas para checar match com 2180 Piso Inox / 2199.
   - Fotos usa `imagens_equipamento` (já existia no schema) — hoje sem
     nenhum registro, então a aba mostra "nenhuma foto cadastrada ainda" até
     as imagens serem enviadas pelo usuário e cadastradas (ver pendência do
     pipeline Drive→Supabase de imagens).
9. **Migração completa do catálogo Drive → Supabase, em andamento** — a pedido do
   usuário ("vamos migrar tudo que está na pasta MVC e MVI"), varrendo pasta por pasta
   de `1 - Catálogos - MVC` (e depois `2 - Catálogo - MVI`), cruzando cada catálogo
   comercial com a LTP correspondente, mesmo processo de sempre (`diferenciais` do
   catálogo primeiro, LTP só pra `restricoes_uso`/`url_ficha_tecnica`, catálogo
   prevalece em conflito). Catálogo foi de 6 → 25 equipamentos nesta sessão:
   - Pasta **Automação** (MVC) — completa. Adicionados: Prix 7T, Prix 7E, Prix 6i,
     Prix 5W Plus (Prix 6i agora confirmado como modelo próprio, distinto do Prix
     6 — resolve a dúvida da pendência de vídeo do item 8 acima; os vídeos "6i" já
     encontrados ainda precisam ser linkados a este registro).
   - Pasta **Checkout** (MVC) — completa. Adicionados: Prix Self Checkout, Prix 8217,
     Prix VSi 410, Magellan 3550 HSi, Magellan 9400i (os 3 últimos são leitores/scanner,
     não balança — mas fazem parte do catálogo comercial oficial da pasta, por isso
     entraram).
   - Pasta **Varejo** (MVC, mapeia pra categoria "Bancada e Pesadoras") — completa,
     exceto **Prix 9094** (não confundir com 9094 Plus): o arquivo na pasta é só um
     stub de texto com uma URL externa (`stportalcorporativoprd.blob.core.windows.net`),
     não o PDF real — não lido ainda, fica pendente. Adicionados: Prix Splash BC201W,
     Prix Splash BP201W, 9094 Plus, 2099, Prix 3 Fit, Prix 3 Plus. 2099 tem a mesma
     restrição Inmetro do 2098 C (não pode venda direta ao público) — confirmado na
     LTP, seguindo o mesmo padrão já registrado pro 2098 C.
   - Pasta **Pesagem de Pessoas** (MVC) — completa. Adicionados: 2096 PP, 2098 PP,
     Júnior Plus (balança de bebê).
   - Pasta **Fatiadores de Frios** (MVC, mapeia pra categoria "Fatiadores") — **parcial**.
     Adicionado só o **Prix Agile 300S** (dados limpos, catálogo + LTP com tabela de
     specs completa). A linha maior de fatiadores (Prix Mezzo 300S/300AS, Veloce 350A,
     Supremo 350A/350S, Filetto 350C — carnes — e a linha antiga Uni 350G/GA/Comfort,
     9300G/Comfort) tem specs espalhadas em PDFs grandes com várias imagens PNG de
     tabela mal OCRizadas (números cortados/ambíguos) — mas ao ler o texto completo
     dos dois PDFs grandes (`Fatiadores novos.pdf` e `Fatiadores_Prix_Web_encrypt.pdf`)
     via `read_file_content` em vez de confiar só no snippet/PNG, os dados vieram
     limpos. Completada: Prix Mezzo 300S, Prix Mezzo 300 AS, Prix Supremo 350S, Prix
     Supremo 350A, Prix Veloce 350A, Prix Filetto 350C (carnes — mesma peça que
     aparecia como "UNI 350 C" numa LTP mais antiga), Prix Uni 350 GA, Prix Uni 350 G
     Comfort, Prix Uni 350 G, Prix 9300G Comfort, Prix 9300G.
   - Pasta **Indicadores Digitais** (MVC, categoria "Indicadores") — completa.
     Adicionados: TI200, 9098 C, 9098 (esse último só tem LTP, sem catálogo comercial
     correspondente — por isso ficou sem `diferenciais`, só specs técnicas da LTP).
   - Pasta **Etiquetas Eletrônicas** (MVC) — completa (nível de produto, não de
     tamanho — um ESL tem várias variantes de tamanho, mesma regra de não duplicar por
     SKU). Duas linhas distintas: **Etiqueta Eletrônica Pricer** (infravermelho, LTP
     encontrada) e **Prix TAG** (parceria com a Zkong, Bluetooth 5.0, sem LTP própria —
     tamanhos complementados pelos datasheets individuais da pasta "ESLs Z-kong").
   - Pasta **Impressoras Comerciais** (MVC, categoria "Impressores") — completa.
     Adicionados: Prix IT400M, 451 Comercial (esta última com restrição: uso exclusivo
     do Mercado Comercial, não industrial — confirmado na LTP).
   - Pasta **Suprimentos** (MVC, categoria "Etiquetas Térmicas") — completa. Um único
     registro resumo ("Etiqueta Térmica Prix", 13 tamanhos de rolo), nível de modelo,
     não por tamanho individual.
   - Pasta **MIT - Mídia Interna** (MVC) — completa. Adicionado MIT 7 (software +
     hardware do player MIT Player W).
   - Com isso, **todas as pastas de categoria da LTP-MVC dentro de Catálogos-MVC estão
     cobertas**. Catálogo em 49 equipamentos.
   - **Ainda não abertas**: as pastas soltas de MVC (Robust, Pesagem de Animais Vivos,
     Seladora a Vácuo, Hamburgueria, Fatiador de Frango, Leitor vertical, Tendal 200,
     Fatiador de carnes, Estimadora de peso) — e a pasta `2 - Catálogo - MVI` inteira
     ainda não foi aberta. Também pendente: **Prix 9094** (não confundir com 9094
     Plus, já cadastrado) — arquivo na pasta Varejo é só um stub de texto com URL
     externa, ainda não lido.
