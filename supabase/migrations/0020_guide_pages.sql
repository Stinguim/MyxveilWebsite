-- Guia de regras: nova tab "Guia", separada da wiki de lore.
-- Mesma forma e mesmas permissões que wiki_pages (ver 0004_wiki_pages.sql),
-- mas em tabela própria por pedido explícito do dono do projeto (manter
-- regras de jogo separadas de lore narrativa).

create table if not exists guide_pages (
  id uuid primary key default gen_random_uuid(),
  categoria text not null check (
    categoria in (
      'criacao_de_personagens',
      'dados_e_como_os_usar',
      'combate',
      'outro'
    )
  ),
  slug text not null unique,
  titulo text not null,
  conteudo text not null default '',
  publicada boolean not null default false,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reaproveita o mesmo trigger de updated_at já usado nas outras tabelas,
-- se existir (set_updated_at). Se a função ainda não existir no projeto,
-- este bloco falha silenciosamente e o campo fica só sem auto-update —
-- confirmar manualmente se a função já existe antes de aplicar.
do $$
begin
  if exists (
    select 1 from pg_proc where proname = 'set_updated_at'
  ) then
    execute 'create trigger guide_pages_set_updated_at
      before update on guide_pages
      for each row execute function set_updated_at()';
  end if;
end $$;

alter table guide_pages enable row level security;

-- Leitura: todos veem páginas publicadas; CRIADOR vê tudo (incl. rascunhos).
create policy guide_pages_select
  on guide_pages for select
  using (
    publicada = true
    or is_criador()
  );

-- Escrita: só CRIADOR, em qualquer operação.
create policy guide_pages_insert_criador_only
  on guide_pages for insert
  with check (is_criador());

create policy guide_pages_update_criador_only
  on guide_pages for update
  using (is_criador())
  with check (is_criador());

create policy guide_pages_delete_criador_only
  on guide_pages for delete
  using (is_criador());

-- Necessário para expor a tabela à Data API (ver nota da migration 0009
-- sobre a mudança de plataforma Supabase de maio de 2026).
grant select on guide_pages to anon, authenticated;
grant insert, update, delete on guide_pages to authenticated;
