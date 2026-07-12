-- ============================================================================
-- 0009_ensure_data_api_grants.sql
-- Projetos Supabase criados a partir de finais de maio de 2026 já não
-- expõem tabelas/views novas à Data API (PostgREST/supabase-js) por
-- omissão — é preciso GRANT explícito. Isto não afeta a segurança dos
-- dados (RLS continua a ser a última linha de defesa), mas sem o GRANT
-- as queries do site falham silenciosamente com "relation does not
-- exist" ou 0 resultados.
--
-- Esta migration é idempotente e segura correr mais do que uma vez.
-- ============================================================================

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.characters to authenticated;
grant select, insert, update, delete on public.character_relations to authenticated;
grant select, insert, update, delete on public.groups to authenticated;
grant select, insert, update, delete on public.wiki_pages to authenticated;
grant select, insert, update, delete on public.character_art to authenticated;
grant select on public.characters_with_owner to authenticated;

-- Sequências/gen_random_uuid() não precisam de grant (não são sequences
-- tradicionais), mas se no futuro alguma tabela usar `serial`/`identity`,
-- lembrar de dar grant em `all sequences in schema public`.
