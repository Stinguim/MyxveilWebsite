-- ============================================================================
-- 0024_wiki_audio.sql
-- Áudio persistente na wiki (tarefa 4 da lista original do dono do
-- projeto, referida como pendente em CHANGELOG_sessao_2.md) — o CRIADOR
-- pode anexar um áudio de leitura da página, mostrado num player logo
-- abaixo do título em /wiki/[slug].
-- ============================================================================

alter table public.wiki_pages
  add column audio_path text;

comment on column public.wiki_pages.audio_path is
  'Path do ficheiro de áudio no bucket character-art (subpasta wiki-guia/wiki-audio/), ou NULL se a página não tiver áudio. Ver lib/wiki/audio-actions.ts.';
