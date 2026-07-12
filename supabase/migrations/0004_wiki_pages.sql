-- ============================================================================
-- 0004_wiki_pages.sql
-- Wiki de lore — secção 6 da spec. Conteúdo estático, editável só pelo CRIADOR.
-- ============================================================================

create type public.categoria_wiki as enum (
  'historia_do_mundo',
  'storyline_principal',
  'grupos_faccoes',
  'designacoes_paranormal',
  'regras_da_mesa',
  'outro'
);

create table public.wiki_pages (
  id uuid primary key default gen_random_uuid(),
  categoria public.categoria_wiki not null,
  slug text not null unique,
  titulo text not null,
  conteudo text not null default '',

  -- secção 8: partes propositadamente censuradas / "POR ATUALIZAR" —
  -- permite marcar uma página como rascunho não publicado, para que a
  -- wiki possa nascer com placeholders sem os expor publicamente.
  publicada boolean not null default false,

  -- referência opcional a um grupo (para páginas de facção ligadas a um
  -- "super-nó" do mapa de relações).
  group_id uuid references public.groups (id) on delete set null,

  ordem smallint not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index wiki_pages_categoria_idx on public.wiki_pages (categoria);

create trigger set_wiki_pages_updated_at
  before update on public.wiki_pages
  for each row execute function public.set_updated_at();

alter table public.wiki_pages enable row level security;

-- Leitura: páginas publicadas são visíveis a todos autenticados; o
-- CRIADOR vê também rascunhos/não publicadas para poder trabalhar nelas.
create policy "wiki_pages_select"
  on public.wiki_pages for select
  to authenticated
  using (publicada = true or public.is_criador());

-- Escrita: só o CRIADOR (secção 6: "conteúdo estático/editável pelo CRIADOR").
create policy "wiki_pages_write_criador_only"
  on public.wiki_pages for all
  to authenticated
  using (public.is_criador())
  with check (public.is_criador());
