-- ============================================================================
-- 0016_altura_e_midia_inspirada.sql
-- Novo campo "altura" e "mídia inspirada" na ficha de personagem.
--
-- - altura: texto curto e livre (ex: "1,80m", "cerca de 6 pés") — sem
--   formato forçado, secção 4.2 da spec não especifica unidade.
-- - midia_inspirada_texto: texto livre/links (ex: refs de Pinterest,
--   nomes de atores/personagens, descrições soltas) — igual em espírito
--   aos outros campos de texto livre da ficha (rotina_diaria, etc).
-- - character_midia_inspirada: mini-galeria de imagens separada da
--   galeria de arte (character_art, migration 0005) — são conceitos
--   diferentes: character_art é arte feita/comissionada da personagem,
--   midia_inspirada são referências/inspirações externas (moodboard).
--   Reaproveita o mesmo bucket 'character-art' (já existe, já tem
--   policies de storage), só muda a tabela de metadados e a convenção
--   de subpasta.
-- ============================================================================

alter table public.characters
  add column altura text,
  add column midia_inspirada_texto text;

comment on column public.characters.altura is
  'Altura do personagem, texto livre (sem unidade forçada) — secção 4.2 da spec.';
comment on column public.characters.midia_inspirada_texto is
  'Mídia inspirada em texto/links livres (referências, moodboard textual). As imagens de mídia inspirada ficam em character_midia_inspirada.';

create table public.character_midia_inspirada (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters (id) on delete cascade,
  uploaded_by uuid not null references public.profiles (id),
  storage_path text not null, -- path dentro do bucket 'character-art'
  legenda text,
  ordem smallint not null default 0,
  created_at timestamptz not null default now()
);

create index character_midia_inspirada_character_id_idx
  on public.character_midia_inspirada (character_id);

comment on table public.character_midia_inspirada is
  'Mini-galeria de imagens de "mídia inspirada" (moodboard/referências), separada de character_art. Reaproveita o bucket character-art com subpasta própria: {owner_id}/{character_id}/inspiracao/{filename}.';

alter table public.character_midia_inspirada enable row level security;

-- Leitura: mesma regra de visibilidade das fichas (reaproveita o padrão
-- já usado em character_art e character_recursos — nunca expor mídia de
-- fichas privadas de outros).
create policy "character_midia_inspirada_select"
  on public.character_midia_inspirada for select
  to authenticated
  using (
    public.is_criador()
    or exists (
      select 1 from public.characters c
      where c.id = character_id
        and (
          (c.visibilidade = 'publica' and c.estado = 'aprovada')
          or c.owner_id = auth.uid()
        )
    )
  );

-- Escrita: dono da ficha ou CRIADOR (mesma regra de character_art).
create policy "character_midia_inspirada_insert"
  on public.character_midia_inspirada for insert
  to authenticated
  with check (
    public.is_criador()
    or exists (
      select 1 from public.characters c
      where c.id = character_id and c.owner_id = auth.uid()
    )
  );

create policy "character_midia_inspirada_delete"
  on public.character_midia_inspirada for delete
  to authenticated
  using (
    public.is_criador()
    or exists (
      select 1 from public.characters c
      where c.id = character_id and c.owner_id = auth.uid()
    )
  );

-- Grant explícito (necessário desde finais de maio 2026 — ver migration 0009).
grant select, insert, update, delete on public.character_midia_inspirada to authenticated;

-- Nota: a policy de storage já existente ("character_art_storage_*", ver
-- 0005) cobre bucket_id = 'character-art' com qualquer subpasta dentro
-- de {owner_id}/..., por isso o upload em {owner_id}/{character_id}/
-- inspiracao/{filename} já funciona sem policy nova.
