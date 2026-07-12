-- ============================================================================
-- 0005_character_art.sql
-- Galeria de arte por personagem — secção 7 da spec.
-- Ficheiros ficam no bucket de Storage 'character-art'; esta tabela guarda
-- os metadados e a referência ao path no bucket.
-- ============================================================================

create table public.character_art (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters (id) on delete cascade,
  uploaded_by uuid not null references public.profiles (id),
  storage_path text not null, -- path dentro do bucket 'character-art'
  legenda text,
  created_at timestamptz not null default now()
);

create index character_art_character_id_idx on public.character_art (character_id);

alter table public.character_art enable row level security;

-- Leitura: visível a todos autenticados (secção 7: "visível a todos").
create policy "character_art_select_authenticated"
  on public.character_art for select
  to authenticated
  using (true);

-- Escrita: só o dono da ficha associada ou o CRIADOR (secção 7: "só
-- editável pelo dono/admin").
create policy "character_art_insert"
  on public.character_art for insert
  to authenticated
  with check (
    public.is_criador()
    or exists (
      select 1 from public.characters c
      where c.id = character_id and c.owner_id = auth.uid()
    )
  );

create policy "character_art_delete"
  on public.character_art for delete
  to authenticated
  using (
    public.is_criador()
    or exists (
      select 1 from public.characters c
      where c.id = character_id and c.owner_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- Storage bucket + políticas
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('character-art', 'character-art', true)
on conflict (id) do nothing;

create policy "character_art_storage_select"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'character-art');

create policy "character_art_storage_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'character-art'
    and (public.is_criador() or (storage.foldername(name))[1] = auth.uid()::text)
  );

create policy "character_art_storage_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'character-art'
    and (public.is_criador() or (storage.foldername(name))[1] = auth.uid()::text)
  );

comment on table public.character_art is
  'Metadados da galeria de arte. Convenção de path no bucket: {owner_id}/{character_id}/{filename}, para que a política de storage baseada na pasta funcione.';
