-- ============================================================================
-- 0018_node_positions.sql
-- Posições persistentes dos nós do mapa de relações (secção 5 da spec).
-- Até aqui o layout era sempre calculado (calcularLayout em
-- grafo-relacoes.tsx: grupos numa linha, personagens em grelha) — com
-- muitos nós isto fica um clutter visual. Esta tabela permite ao
-- CRIADOR arrastar os nós e a posição ficar guardada, visível a todos.
-- ============================================================================

create type public.tipo_no_mapa as enum ('personagem', 'grupo');

create table public.node_positions (
  id uuid primary key default gen_random_uuid(),
  tipo public.tipo_no_mapa not null,
  ref_id uuid not null, -- id do character ou do group, consoante 'tipo'
  x real not null,
  y real not null,
  updated_at timestamptz not null default now(),

  constraint node_positions_tipo_ref_unico unique (tipo, ref_id)
);

comment on table public.node_positions is
  'Posição (x, y) guardada manualmente para um nó do mapa de relações (personagem ou grupo), definida ao arrastar em /admin/mapa. Nós sem entrada aqui usam o layout automático calculado no cliente.';

create index node_positions_tipo_ref_idx on public.node_positions (tipo, ref_id);

create trigger set_node_positions_updated_at
  before update on public.node_positions
  for each row execute function public.set_updated_at();

alter table public.node_positions enable row level security;

-- Leitura: todos autenticados veem o layout guardado (secção 5:
-- jogadores têm vista somente-leitura do mapa).
create policy "node_positions_select_authenticated"
  on public.node_positions for select
  to authenticated
  using (true);

-- Escrita: só o CRIADOR (mesma regra de character_relations/groups).
create policy "node_positions_write_criador_only"
  on public.node_positions for all
  to authenticated
  using (public.is_criador())
  with check (public.is_criador());

grant select, insert, update, delete on public.node_positions to authenticated;
