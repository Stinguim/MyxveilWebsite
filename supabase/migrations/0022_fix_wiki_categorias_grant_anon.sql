-- ============================================================================
-- 0022_fix_wiki_categorias_grant_anon.sql
-- Corrige um esquecimento na migration 0021: wiki_categorias só tinha
-- GRANT SELECT e a policy de leitura restritos a "authenticated", mas
-- /wiki é uma rota pública (wiki_pages já cobre "anon" desde a
-- migration 0004/0009). Sem isto, qualquer visitante sem sessão via a
-- listagem de páginas vazia — o join categoria:wiki_categorias(...)
-- feito nas páginas de leitura falhava silenciosamente para "anon".
--
-- O Postgres exige as duas coisas para uma tabela ser legível por um
-- papel: GRANT ao nível do papel + policy RLS que também cubra esse
-- papel. A policy já usava "using (true)" (pretendia ser pública), mas
-- estava presa a "to authenticated" — falta agora abranger "anon".
-- ============================================================================

grant select on public.wiki_categorias to anon;

drop policy "wiki_categorias_select" on public.wiki_categorias;

create policy "wiki_categorias_select"
  on public.wiki_categorias for select
  to anon, authenticated
  using (true);
