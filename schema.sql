-- Agente Comercial Toledo — schema
-- Supabase já habilita a extensão pgcrypto por padrão (necessária para gen_random_uuid())

-- linhas de negócio da Toledo — tabela de referência em vez de check constraint fixo,
-- porque a MVV (Varejo) ainda vai ser lançada e não deve exigir migração de schema
create table if not exists linhas_negocio (
  codigo  text primary key,          -- "MVC", "MVI", "MVV"
  nome    text not null              -- "Marketing e Vendas Comercial"
);

insert into linhas_negocio (codigo, nome) values
  ('MVC', 'Marketing e Vendas Comercial'),
  ('MVI', 'Marketing e Vendas Industrial')
on conflict (codigo) do nothing;

-- quando a MVV (Marketing Vendas Varejo) for lançada oficialmente, só rodar:
-- insert into linhas_negocio (codigo, nome) values ('MVV', 'Marketing Vendas Varejo');

create table if not exists equipamentos (
  id                uuid primary key default gen_random_uuid(),
  modelo            text not null,                 -- ex.: "2098 C"
  linha             text not null references linhas_negocio(codigo),
  categoria         text,                           -- ex.: "Bancada e Pesadoras" — taxonomia real das pastas LTP no Drive
  descricao_curta   text,

  -- resumo das specs (faixa de capacidade, opções de comunicação etc.) — não cada
  -- código de venda/SKU individual (decisão: nível de modelo, não de variante)
  specs_tecnicas    jsonb not null default '{}',

  restricoes_uso     text,                           -- ex.: restrição Inmetro (uso comercial), restrição técnica (ex. não instalar em câmara fria) — nunca omitir do vendedor
  url_ficha_tecnica text,                           -- link pro PDF original (LTP) com a tabela completa de variantes/códigos de venda

  preco_faixa       text,                           -- ex.: "sob consulta" — nunca número solto sem revisão
  status            text not null default 'ativo' check (status in ('ativo','descontinuado')),

  -- rastreabilidade — base da regra de "zero invenção"
  fonte             text not null,
  revisado_por      text,
  revisado_em       timestamptz,

  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now()
);

create table if not exists imagens_equipamento (
  id                uuid primary key default gen_random_uuid(),
  equipamento_id    uuid not null references equipamentos(id) on delete cascade,
  url_webp          text not null,
  url_jpg_fallback  text not null,
  tipo              text default 'produto' check (tipo in ('produto','detalhe','aplicacao')),
  ordem             int default 0
);

create index if not exists idx_equipamentos_linha on equipamentos(linha);
create index if not exists idx_equipamentos_categoria on equipamentos(categoria);
create index if not exists idx_equipamentos_status on equipamentos(status);
create index if not exists idx_imagens_equipamento_id on imagens_equipamento(equipamento_id);

-- RLS: leitura liberada a qualquer usuário autenticado; escrita só via service_role
-- (aplicado como migration separada no Supabase — replicado aqui para quem recriar o schema do zero)
alter table linhas_negocio enable row level security;
alter table equipamentos enable row level security;
alter table imagens_equipamento enable row level security;

create policy "leitura autenticada - linhas_negocio" on linhas_negocio
  for select to authenticated using (true);

create policy "leitura autenticada - equipamentos revisados" on equipamentos
  for select to authenticated using (revisado_por is not null and status = 'ativo');

create policy "leitura autenticada - imagens_equipamento" on imagens_equipamento
  for select to authenticated using (
    exists (
      select 1 from equipamentos e
      where e.id = imagens_equipamento.equipamento_id
        and e.revisado_por is not null
        and e.status = 'ativo'
    )
  );

-- exemplo real de specs_tecnicas — MVC, derivado da ficha técnica (LTP) da 2098 C
--
-- {
--   "capacidade_min_kg": 30,
--   "capacidade_max_kg": 300,
--   "display": "LCD gráfico com backlight",
--   "opcoes_comunicacao": ["Sem saída", "RS-232C", "Ethernet", "Wi-Fi"],
--   "montagens_disponiveis": ["Coluna 0,5 m", "Coluna 0,8 m", "Indicação remota"]
-- }
--
-- exemplo real de specs_tecnicas — MVI, derivado da ficha técnica (LTP) da 2180 Piso Inox
--
-- {
--   "capacidade_min_kg": 300,
--   "capacidade_max_kg": 6000,
--   "material_plataforma": "Aço inox AISI-304",
--   "grau_protecao_celula_carga": "IP66/IP68 (Prix Carcará) ou IP67 (outros fabricantes)",
--   "terminais_compativeis": ["TI400", "TI500"],
--   "grau_protecao_terminal": "IP69K"
-- }
