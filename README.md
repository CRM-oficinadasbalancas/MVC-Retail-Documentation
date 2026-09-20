# Agente Comercial Toledo

App de apoio comercial (PWA) para vendedores das linhas comercial (MVC) e
industrial (MVI) da Toledo: catálogo de equipamentos, comparação entre
modelos e geração de apresentação em PDF para envio ao cliente.

Ver `CLAUDE.md` para o contexto completo do projeto, a regra crítica de
"zero invenção da IA" e o status atual.

## Setup local

```bash
cp .env.local.example .env.local
# preencher NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
# SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY e ALLOWED_EMAIL_DOMAIN

npm install
npm run dev
```

Pendências de configuração fora do código (ver CLAUDE.md § "Status atual"):
habilitar o provider Google no Supabase Auth do projeto
`agente-comercial-toledo`, definir `ALLOWED_EMAIL_DOMAIN` com o domínio real
da Toledo, e popular a tabela `equipamentos` com dados reais revisados.

## Stack

- Next.js (App Router) — PWA instalável
- Supabase (Postgres + Auth + Storage)
- Claude API — busca em linguagem natural com ferramenta única de leitura
- pdf-lib — geração da apresentação em PDF
- Vercel — deploy
