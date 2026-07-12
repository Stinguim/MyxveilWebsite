-- ============================================================================
-- 0002_characters.sql
-- Fichas de personagem — campos da secção 4 da spec.
-- ============================================================================

create type public.genero_personagem as enum ('homem', 'mulher', 'nao_binario', 'outro');
create type public.especie_personagem as enum ('humano', 'furry', 'monstro', 'outro');
create type public.origem_personagem as enum ('cidade', 'vila', 'campo', 'nenhum_especifico', 'outro');

create type public.grupo_pertenca as enum (
  'apic',
  'pawned',
  'culto_da_duvessa',
  'ajudantes_do_eshir',
  'void',
  'anormais',
  'nenhum',
  'outro'
);

create type public.classe_personagem as enum (
  'tank',
  'dps_subdps',
  'suporte',
  'investigador',
  'explorador',
  'social',
  'utilidade'
);

create type public.elemento_paranormal as enum (
  'magia_energia_paranormal',
  'tecnologia_paranormal',
  'tempo_paranormal',
  'quebra_da_realidade',
  'fe_paranormal',
  'onirismo',
  'tinta_paranormal',
  'cosmico',
  'void',
  'nao_sei_deixar_historia_decidir',
  'nenhum',
  'outro'
);

create type public.estado_ficha as enum ('rascunho', 'submetida', 'aprovada', 'arquivada');
create type public.visibilidade_ficha as enum ('publica', 'privada');

create table public.characters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,

  -- 4.2 Base do personagem
  nome text not null,
  idade int,
  genero public.genero_personagem,
  genero_outro text, -- preenchido quando genero = 'outro'
  especie public.especie_personagem,
  especie_outro text,
  origem public.origem_personagem,
  origem_outro text,
  aparencia text,

  -- 4.3 Psicológico / roleplay (todos opcionais, texto livre)
  rotina_diaria text,
  o_que_o_deixa_feliz text,
  como_se_move text,
  maior_desejo_objetivo text,
  maior_medo_inseguranca text,
  memoria_recorrente text,
  talento_mundano text,
  comportamento_sob_pressao text,
  primeira_interacao_paranormal text,
  grupo public.grupo_pertenca,
  grupo_outro text,
  lore_adicional text,

  -- 4.4 Atributos (0–4 cada; total sugerido 9 a nível 1 — validado na aplicação)
  atributo_for smallint not null default 0 check (atributo_for between 0 and 4),
  atributo_int smallint not null default 0 check (atributo_int between 0 and 4),
  atributo_des smallint not null default 0 check (atributo_des between 0 and 4),
  atributo_car smallint not null default 0 check (atributo_car between 0 and 4), -- CAR fora de combate / PVC dentro de combate
  atributo_con smallint not null default 0 check (atributo_con between 0 and 4),
  atributo_sp smallint not null default 0 check (atributo_sp between 0 and 4),

  -- 4.5 Classes (máx. 2 recomendado — validado na aplicação, não na BD)
  classe_principal public.classe_personagem,
  classe_principal_nivel smallint check (classe_principal_nivel between 1 and 5),
  classe_secundaria public.classe_personagem,
  classe_secundaria_nivel smallint check (classe_secundaria_nivel between 1 and 5),

  -- 4.6 Stats calculados automaticamente (colunas geradas — nunca escritas diretamente)
  -- HP = 1d6 + 8 + CON. O valor do dado (1-6) é guardado separadamente
  -- para permitir rolar no momento da criação (decisão em aberto na spec,
  -- secção 4.6) e o HP total é derivado.
  hp_dado_1d6 smallint not null default 4 check (hp_dado_1d6 between 1 and 6),
  hp_total smallint generated always as (hp_dado_1d6 + 8 + atributo_con) stored,
  sanidade smallint generated always as (10 - atributo_int) stored,
  movimento smallint generated always as (1 + (atributo_des / 2)) stored,

  -- 4.7 Combate/gameplay
  arma text,
  elemento_paranormal public.elemento_paranormal,
  elemento_paranormal_outro text,
  habilidade_1 text,
  habilidade_2 text,

  -- 4.8 Metadados de campanha
  campanha text,
  estado public.estado_ficha not null default 'rascunho',

  -- Visibilidade — controlada pelo dono, independente do 'estado'.
  -- "privada" esconde a ficha de todos exceto o dono e o CRIADOR.
  visibilidade public.visibilidade_ficha not null default 'publica',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.characters is
  'Fichas de personagem digitais. HP, sanidade e movimento são colunas geradas (secção 4.6 da spec) — nunca inseridas/atualizadas diretamente.';

create index characters_owner_id_idx on public.characters (owner_id);
create index characters_estado_idx on public.characters (estado);

create trigger set_characters_updated_at
  before update on public.characters
  for each row execute function public.set_updated_at();

alter table public.characters enable row level security;

-- Leitura: fichas públicas E aprovadas são visíveis a todos autenticados;
-- o dono vê sempre as suas próprias (qualquer estado/visibilidade); o
-- CRIADOR vê tudo.
create policy "characters_select"
  on public.characters for select
  to authenticated
  using (
    (visibilidade = 'publica' and estado = 'aprovada')
    or owner_id = auth.uid()
    or public.is_criador()
  );

-- Criação: um jogador só pode criar fichas com owner_id = si próprio.
create policy "characters_insert_own"
  on public.characters for insert
  to authenticated
  with check (owner_id = auth.uid());

-- Edição: o dono edita a sua ficha (secção 3: "Cria e edita as suas
-- próprias fichas"); o CRIADOR edita/arquiva qualquer ficha.
create policy "characters_update"
  on public.characters for update
  to authenticated
  using (owner_id = auth.uid() or public.is_criador())
  with check (owner_id = auth.uid() or public.is_criador());

-- Remoção: só o CRIADOR remove fichas (jogadores arquivam via 'estado',
-- não apagam definitivamente).
create policy "characters_delete_criador_only"
  on public.characters for delete
  to authenticated
  using (public.is_criador());
