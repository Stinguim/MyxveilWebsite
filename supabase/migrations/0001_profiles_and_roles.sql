-- ============================================================================
-- 0001_profiles_and_roles.sql
-- Perfis de utilizador e papéis (CRIADOR vs jogador) — ver secção 3 da spec.
-- ============================================================================

-- Papel do utilizador na plataforma.
create type public.user_role as enum ('criador', 'jogador');

-- Experiência prévia em RPG (secção 4.1 da spec).
create type public.experiencia_rpg as enum (
  'nunca_jogou',
  'algumas_vezes',
  'varias_vezes',
  'regular'
);

-- Perfil de utilizador, associado 1:1 a um utilizador de auth.users.
-- Guarda os campos da secção 4.1 (identificação do jogador, preenchida
-- uma vez, associada à conta) e o papel do utilizador.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'jogador',
  nome_alcunha text,
  discord_username text,
  experiencia_rpg public.experiencia_rpg,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Perfil de utilizador. Um único registo tem role=criador (o DM/admin); todos os outros são jogador.';

-- Só deve existir UM criador. Garantido por um índice parcial único.
create unique index one_criador_only
  on public.profiles (role)
  where role = 'criador';

alter table public.profiles enable row level security;

-- Qualquer pessoa autenticada pode ver perfis (necessário para, por
-- exemplo, mostrar nome/alcunha do autor de uma ficha).
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- Um utilizador só pode editar o seu próprio perfil.
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Função auxiliar: devolve true se o utilizador autenticado atual é o CRIADOR.
-- security definer + search_path fixo para evitar hijacking de search_path.
create or replace function public.is_criador()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'criador'
  );
$$;

-- Trigger: cria automaticamente uma linha em profiles quando um novo
-- utilizador se regista (via email/password ou Discord OAuth).
--
-- Nota sobre os metadados do Discord: o Supabase devolve o handle
-- ("stinguim", sem #discriminador) em raw_user_meta_data->>'full_name',
-- e o nome de exibição atual (que pode mudar) em
-- raw_user_meta_data->'custom_claims'->>'global_name'. Não existe chave
-- 'user_name' nos metadados do Discord — isso é próprio de outros
-- providers (ex: GitHub).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome_alcunha, discord_username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'full_name' -- populado automaticamente no login via Discord
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger genérico para manter updated_at atualizado.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
