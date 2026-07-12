-- ============================================================================
-- 0003_character_relations.sql
-- Mapa de relações entre personagens — secção 5 da spec.
-- Grafo: nós = characters (+ groups como "super-nós"), arestas = character_relations.
-- ============================================================================

create type public.tipo_relacao as enum (
  'aliado',
  'inimigo',
  'familia',
  'romance',
  'desconhece_se',
  'rival',
  'outro'
);

-- Grupos/facções como "super-nós" do grafo (secção 5 e 6: APIC, PAWNED,
-- Culto da Duvessa, Ajudantes do Eshir, Anormais, Void, etc).
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  descricao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_groups_updated_at
  before update on public.groups
  for each row execute function public.set_updated_at();

alter table public.groups enable row level security;

create policy "groups_select_authenticated"
  on public.groups for select
  to authenticated
  using (true);

create policy "groups_write_criador_only"
  on public.groups for all
  to authenticated
  using (public.is_criador())
  with check (public.is_criador());

-- Arestas do grafo. Uma aresta liga dois characters, OU um character a um
-- group (personagem pertence a um grupo), nunca os dois em simultâneo nem
-- nenhum dos dois.
create table public.character_relations (
  id uuid primary key default gen_random_uuid(),

  character_a_id uuid not null references public.characters (id) on delete cascade,

  character_b_id uuid references public.characters (id) on delete cascade,
  group_b_id uuid references public.groups (id) on delete cascade,

  tipo public.tipo_relacao not null,
  tipo_outro text, -- preenchido quando tipo = 'outro'
  descricao text,

  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint character_relations_one_target check (
    (character_b_id is not null and group_b_id is null)
    or (character_b_id is null and group_b_id is not null)
  ),
  constraint character_relations_no_self_loop check (
    character_a_id is distinct from character_b_id
  )
);

create index character_relations_a_idx on public.character_relations (character_a_id);
create index character_relations_b_idx on public.character_relations (character_b_id);
create index character_relations_group_b_idx on public.character_relations (group_b_id);

create trigger set_character_relations_updated_at
  before update on public.character_relations
  for each row execute function public.set_updated_at();

alter table public.character_relations enable row level security;

-- Leitura: qualquer autenticado vê o grafo (secção 5: "jogadores têm
-- vista somente-leitura").
create policy "character_relations_select_authenticated"
  on public.character_relations for select
  to authenticated
  using (true);

-- Escrita (insert/update/delete): só o CRIADOR (secção 5: "Só o CRIADOR
-- cria/edita arestas").
create policy "character_relations_write_criador_only"
  on public.character_relations for all
  to authenticated
  using (public.is_criador())
  with check (public.is_criador());
