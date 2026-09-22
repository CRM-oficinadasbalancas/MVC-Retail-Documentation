# Migração de imagens de produto — pasta "13 - Imagens de produtos" (Drive) → Supabase

Preparado numa sessão de Claude Code na nuvem, mas **essa etapa final precisa rodar
localmente** (a sandbox da nuvem bloqueia acesso direto ao domínio do Supabase por
política de rede — o resto do trabalho de mapeamento já está pronto aqui).

## O que já está pronto

- Bucket `imagens-equipamentos` criado no Supabase (público pra leitura, escrita só
  via service role).
- `manifest.json` — 48 imagens já casadas com os 32 modelos certos do catálogo
  (título do arquivo no Drive, `driveFileId`, `equipamentoId`, `ordem`). Ficaram de
  fora deliberadamente: `3400 Plus.png` (balança ainda não criada), toda a série
  antiga "2098 + 9098/ti200" (2098 C fica sem foto por hora) e `2124_9098C.png`.
- `process_image.js` — recebe o JSON baixado do Drive, gera WebP (padrão) + JPG
  (fallback, fundo branco), redimensiona pra no máximo 1600px, sobe os dois pro
  Storage e insere a linha em `imagens_equipamento`. Já testado com sucesso (imagem
  do 2096 PP) — só falhou por bloqueio de rede da sandbox, não por bug.

## Como rodar

Pré-requisitos: repositório clonado localmente, `npm install` já rodado (usa o
`sharp` que já é dependência do projeto), Claude Code com acesso ao MCP do Google
Drive (mesma conta usada na migração do catálogo) e a `SUPABASE_SERVICE_ROLE_KEY`
(Project Settings → API → service_role no painel do Supabase) — **não** commitar essa
chave em nenhum arquivo.

### Opção 1 — pedir pro Claude Code local fazer

Cole isto numa sessão de Claude Code local, dentro do repo:

> Leia `scripts/migrar-imagens/manifest.json`. Para cada item, use a ferramenta MCP
> do Google Drive `download_file_content` com o `driveFileId` pra baixar a imagem, e
> em seguida rode `node scripts/migrar-imagens/process_image.js <caminho do JSON
> salvo pelo download> <equipamentoId> <ordem> produto` (com `SUPABASE_URL` e
> `SUPABASE_SERVICE_ROLE_KEY` no ambiente, nunca gravadas em arquivo). Confirme no
> final quantas imagens foram cadastradas com sucesso e reporte qualquer erro.

### Opção 2 — manual, item por item

Para cada entrada do `manifest.json`:

```bash
SUPABASE_URL="https://xdzkpjqycnjcaohzuprv.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="<cole a chave aqui só no terminal, não salve em arquivo>" \
node scripts/migrar-imagens/process_image.js \
  <caminho-do-json-baixado-do-drive> \
  <equipamentoId> \
  <ordem> \
  produto
```

## Depois de rodar

Depois que as 48 imagens estiverem cadastradas, este diretório (`scripts/migrar-imagens/`)
pode ser apagado do repositório — era só uma ferramenta de uma vez, não faz parte do
app.
