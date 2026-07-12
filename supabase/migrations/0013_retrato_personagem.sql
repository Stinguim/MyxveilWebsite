-- ============================================================================
-- 0013_retrato_personagem.sql
-- Retrato/portrait da personagem — campo simples em characters (diferente
-- da galeria de arte em character_art, que é uma coleção de imagens; o
-- retrato é único, editável, e usado no card da listagem e na ficha).
--
-- Reaproveita o bucket 'character-art' já existente (público, migration
-- 0005) — mesma convenção de path {owner_id}/{character_id}/{filename},
-- por isso as políticas de storage já em vigor cobrem também o retrato
-- sem precisar de policies novas.
-- ============================================================================

alter table public.characters
  add column retrato_path text;

comment on column public.characters.retrato_path is
  'Path do retrato dentro do bucket de Storage "character-art" (convenção {owner_id}/{character_id}/{filename}). NULL = usa a imagem default no frontend.';
